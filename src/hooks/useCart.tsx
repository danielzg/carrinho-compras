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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const emEstoque = await api.get<Stock>(`/stock/${productId}`)
                                .then(response => response.data);
      
      let newCart = [...cart];         
      const index = newCart.findIndex(product => product.id === productId)    
  
        if(index >= 0) {

          if((newCart[index].amount + 1) > emEstoque.amount){
            toast.error('Quantidade solicitada fora de estoque');
            return;
          }

          newCart[index].amount += 1;
          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        }else {
          
          const inserirProduto = await api.get<Product>(`/products/${productId}`)
                                            .then( response => response.data)
          inserirProduto.amount = 1;

          newCart.push(inserirProduto)  
          
          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        }
     
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];

      const index = newCart.findIndex(product => product.id === productId)

      if(index < 0){
        toast.error('Erro na remoção do produto');
        return;  
      }

      const remove = newCart.splice(index, 1)

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart];
      const index = newCart.findIndex(product => product.id === productId)

      if(index < 0){
        throw Error();
      }

      if(amount <= 0){
        return;
      }

      const estoque = await api.get<Stock>(`/stock/${productId}`)
                          .then(response => response.data)

      if(amount > estoque.amount ){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      newCart[index].amount = amount;
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

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
