import type { NextPage } from "next";
import { useContext } from "react";
import { Container } from "@chakra-ui/react";
import { MetaMaskContext } from "../contexts/metaMaskContext";
import SearchInputs from "../components/searchInputs";
import SearchResults from "../components/searchResults";

const Home: NextPage = () => {
  const { web3 } = useContext(MetaMaskContext);
  return (
    <Container
      minHeight={"100vh"}
      color={"#fff"}
      width={"100%"}
      maxWidth={"none"}
      padding={{ base: "50px 0", lg: 100, md: "50px 0" }}
      bgGradient="linear(to-t, #2c3e50, #34495e)"
    >
      <Container>
        {web3 && <SearchInputs />}
        <SearchResults />
      </Container>
    </Container>
  );
};

export default Home;
