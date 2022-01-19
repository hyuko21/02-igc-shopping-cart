import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const saveCart = async (products: Product[]) => {
    const newCart = [...cart, ...products];
    setCart(newCart);
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
  }

  const checkStock = async (productId: number, newAmount: number) => {
    const { data: productStock } = await api.get(`stock/${productId}`)
    if (!productStock) return false
    if (productStock.amount < newAmount) {
      toast.error('Quantidade solicitada fora de estoque')
      return false
    }
    return true
  }

  const addProduct = async (productId: number) => {
    try {
      const cartProduct = cart.find(product => product.id === productId);
      if (cartProduct) {
        const newAmount = cartProduct.amount + 1;
        const hasStock = await checkStock(cartProduct.id, newAmount);
        if (hasStock) {
          cartProduct.amount = newAmount;
          saveCart([cartProduct]);
        }
      } else {
        const newAmount = 1;
        const hasStock = await checkStock(productId, newAmount);
        if (hasStock) {
          const { data: product } = await api.get(`products/${productId}`);
          const newCartProduct = { ...product, amount: newAmount };
          saveCart([newCartProduct]);
        }
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let productFound = false
      const newCartProducts = cart.filter((product) => {
        if (product.id === productId) {
          productFound = true
          return false
        }
        return true
      })
      if (!productFound) throw new Error()
      saveCart(newCartProducts)
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
