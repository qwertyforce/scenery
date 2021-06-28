/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { createContext,useEffect,useState } from "react";

interface DataContextProps{
  useIPFS:boolean,
  _handleSwitchUseIPFS:()=>void
}

export const DataContext = createContext<DataContextProps | null>(null);


//{ useIPFS,_handleSwitchUseIPFS}
const DataContextProvider = ({ children }: any) => {
  const [useIPFS, setUseIPFS] = useState(false)
  useEffect(()=>{
    if (typeof window !== "undefined" && localStorage.getItem("useIPFS") === "true") {
      setUseIPFS(true)
    }
  },[])
  // console.log(useIPFS)
  const _handleSwitchUseIPFS = () => {
    localStorage.setItem('useIPFS', (!useIPFS).toString())
    setUseIPFS(!useIPFS)
  }
  const data_obj={ useIPFS, _handleSwitchUseIPFS }
  return (
    <DataContext.Provider value={data_obj}>
      {children}
    </DataContext.Provider>
  );
};

export {DataContextProvider };