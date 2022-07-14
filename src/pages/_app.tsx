import { Fragment } from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import MetaMaskContextProvider from "../contexts/metaMaskContext";
import CdpContextProvider from "../contexts/cdpContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Fragment>
      <Head>
        <title>CDP Finder</title>
        <meta name="description" content="Explore Maker DAO CDP by ID" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ChakraProvider>
        <MetaMaskContextProvider>
          <CdpContextProvider>
            <Component {...pageProps} />
          </CdpContextProvider>
        </MetaMaskContextProvider>
      </ChakraProvider>
    </Fragment>
  );
}

export default MyApp;
