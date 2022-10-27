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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
     return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id ===productId);
      const stockResponse = await api.get(`stock/${productId}`);
      const productResponse = await api.get(`products/${productId}`);

      if (productExists) {
        if (productExists.amount < stockResponse.data.amount) {
          productExists.amount += 1;
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }        
      } else {
          const selectedProduct = {
            ...productResponse.data,
            amount: 1
          };
          updatedCart.push(selectedProduct);
      };
      
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let updatedCart = [...cart];
      const selectedProduct = updatedCart.find(product => product.id === productId);

      if (selectedProduct) {
        updatedCart = updatedCart.filter(product => product.id !== productId);
        setCart(updatedCart);
        console.log('vsf')
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      };

      const stockResponse = await api.get(`stock/${productId}`);
      const stockAmount = stockResponse.data.amount;
      
      if ( amount > stockAmount ) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const updatedProduct = updatedCart.find(product => productId === product.id);
      
      if (updatedProduct) {
        updatedProduct.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        console.log('tncccc')
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
