import { useContext, useState } from "react";
import { Box, Button, Link } from "@chakra-ui/react";
import Image from "next/image";

import { MetaMaskContext } from "../contexts/metaMaskContext";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Text,
} from "@chakra-ui/react";

const MetaMaskButton = () => {
  const [open, setOpen] = useState(false);
  const { connected, setConnected, provider, metamaskInstalled } =
    useContext(MetaMaskContext);
  const connectMetamask = async () => {
    provider
      .request({ method: "eth_requestAccounts" })
      .then(() => {
        setConnected(true);
      })
      .catch(() => {
        setConnected(false);
      });
  };
  return (
    <Box position={"relative"}>
      <Popover isLazy isOpen={open} onClose={() => setOpen(false)}>
        <PopoverContent bg="#079992" border={0}>
          <PopoverHeader
            fontWeight="semibold"
            display="flex"
            alignItems={"center"}
          >
            <Image src="/MetaMask_Fox.svg" />
            <Text marginLeft="5px">MetaMask not installed</Text>
          </PopoverHeader>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverBody>
            To sign a CDP, please{" "}
            <Link
              href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn"
              textDecor="underline"
              target="_blank"
            >
              install
            </Link>{" "}
            MetaMask wallet.
          </PopoverBody>
        </PopoverContent>
      </Popover>

      <Button
        aria-label="MetaMask"
        background={"#2c3e50"}
        position={"relative"}
        onClick={metamaskInstalled ? connectMetamask : () => setOpen(true)}
        pointerEvents={connected ? "none" : "auto"}
        padding={2}
        tabIndex={connected ? -1 : 0}
        _hover={{ bg: "#243342" }}
      >
        <Image
          src="/MetaMask_Fox.svg"
          width="30px"
          height="30px"
          alt="MetaMask button logo"
        />
      </Button>
      <Box
        width="5px"
        height="5px"
        borderRadius="50%"
        background={connected ? "#16a085" : "#e74c3c"}
        position={"absolute"}
        top={"3px"}
        left="3px"
      ></Box>
    </Box>
  );
};

export default MetaMaskButton;
