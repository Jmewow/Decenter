import { createContext, useState, useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import Web3 from "web3";

interface MetaMaskContextType {
  connected: boolean;
  setConnected: (val: boolean) => void;
  provider: any;
  web3: any;
  setWeb3: (val: any) => void;
  metamaskInstalled: boolean;
}

export const MetaMaskContext = createContext<MetaMaskContextType>({
  connected: false,
  setConnected: () => {},
  provider: {},
  web3: {},
  setWeb3: () => {},
  metamaskInstalled: false,
});

const MetaMaskContextProvider = (props: any) => {
  const [metamaskProvider, setMetamaskProvider] = useState();
  const [metamaskInstalled, setMetamaskInstalled] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [web3, setWeb3] = useState<any>();

  useEffect(() => {
    let provider: any;
    const detectProvider = async () => {
      provider = await detectEthereumProvider();
      if (provider) {
        startApp(provider);
      } else {
        console.log("Please install MetaMask!");
        setMetamaskInstalled(false);
        const ethNetwork =
          "https://mainnet.infura.io/v3/717c889a58ec4445b9af10611afbd38e";
        const infuraWeb3 = new Web3(
          new Web3.providers.HttpProvider(ethNetwork)
        );
        setWeb3(infuraWeb3);
      }

      async function startApp(provider: any) {
        if (provider !== window.ethereum) {
          console.error("Do you have multiple wallets installed?");
        }
        // Access the decentralized web!
        setMetamaskInstalled(true);
        setMetamaskProvider(provider);
        let newWeb3 = new Web3(provider);
        setWeb3(newWeb3);
        let connectedMetamask = await provider.request({
          method: "eth_accounts",
        });
        setConnected(!!connectedMetamask.length);
        provider.on("accountsChanged", handleListener);
      }
    };
    detectProvider();

    function handleListener(response: Array<string>) {
      setConnected(!!response.length);
    }
    return () => {
      if (provider.removeListener) {
        provider.removeListener("accountsChanged", handleListener);
      }
    };
  }, []);

  return (
    <MetaMaskContext.Provider
      value={{
        connected,
        setConnected: (val: boolean) => setConnected(val),
        provider: metamaskProvider!,
        web3,
        setWeb3: val => setWeb3(val),
        metamaskInstalled,
      }}
    >
      {props.children}
    </MetaMaskContext.Provider>
  );
};
export default MetaMaskContextProvider;
