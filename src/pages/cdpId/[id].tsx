import type { NextPage } from "next";
import Details from "../../components/details";

import { useContext, Fragment } from "react";
import { MetaMaskContext } from "../../contexts/metaMaskContext";
import { Container } from "@chakra-ui/react";

const IdPage: NextPage = () => {
  const { web3 } = useContext(MetaMaskContext);

  // Imao sam problem sa ucitavanjem strane pre web3 initalizacije, jer je useContract hook odmah pokusavao da napravi contract.
  // Na kraju sam celu komponentu koja zove taj hook prebacio u drugu funkciju i renderujem je kada je web3 initalizovan
  return <Fragment>{web3 && <Details />}</Fragment>;
};

export default IdPage;
