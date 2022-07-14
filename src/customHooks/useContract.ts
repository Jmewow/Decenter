import { useContext, useEffect, useState } from "react";
import { MetaMaskContext } from "../contexts/metaMaskContext";
import { Contract } from "web3-eth-contract";

const useContract = (contractAddress: string, abi: any) => {
  const { web3 } = useContext(MetaMaskContext);
  const [contract, setContract] = useState<Contract>();
  useEffect(() => {
    let newContract = new web3.eth.Contract(abi, contractAddress);
    setContract(newContract);
  }, [contractAddress, web3, abi]);

  return contract;
};

export default useContract;
