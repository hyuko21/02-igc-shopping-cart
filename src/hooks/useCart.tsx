import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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

  const saveCart = async (cart: Product[]) => {
    setCart(cart);
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
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
      let newCart = [...cart]
      let cartProduct = cart.find(product => product.id === productId)
      if (cartProduct) {
        const newAmount = cartProduct.amount + 1
        const hasStock = await checkStock(cartProduct.id, newAmount);
        if (hasStock) {
          newCart = cart.map((product) => {
            if (product.id !== cartProduct?.id) return product
            return { ...cartProduct, amount: cartProduct.amount + 1 }
          })
          saveCart(newCart)
        }
      } else {
        const newAmount = 1
        const hasStock = await checkStock(productId, newAmount);
        if (hasStock) {
          const { data: product } = await api.get(`products/${productId}`);
          const newCartProduct = { ...product, amount: newAmount };
          newCart = [...newCart, newCartProduct]
          saveCart(newCart)
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
      const hasStock = await checkStock(productId, amount)
      if (!hasStock) throw new Error()
      if (amount < 1) return
      const newCartProducts = cart.map((product) => {
        if (product.id !== productId) return product
        return { ...product, amount }
      })
      saveCart(newCartProducts)
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
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
