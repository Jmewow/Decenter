import {
  Container,
  Flex,
  Button,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Box,
  Link,
} from "@chakra-ui/react";
import MetaMaskButton from "./metaMaskButton";
import { useRouter } from "next/router";
import { useEffect, useContext, useState, useCallback } from "react";
import { CdpContext } from "../contexts/cdpContext";
import getCdp from "../api/getCdpId";
import useContract from "../customHooks/useContract";
import vaultInfoAbi from "../abi/vaultInfo_abi";
import interestRatesAbi from "../abi/interest_rates_abi";
import { MetaMaskContext } from "../contexts/metaMaskContext";
import { handleCdp } from "../api/utils";
import { useDebounce } from "../customHooks/useDebounce";

const Details = () => {
  const [cdp, setCdp] = useState<any>({ id: 0 });
  const { cdpArray } = useContext(CdpContext);
  const router = useRouter();
  const vaultContract = useContract(
    "0x68C61AF097b834c68eA6EA5e46aF6c04E8945B2d",
    vaultInfoAbi
  );
  const interestRatesContract: any = useContract(
    "0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B",
    interestRatesAbi
  );
  const { web3, connected } = useContext(MetaMaskContext);
  const [metaMaskSignature, setMetamaskSignature] = useState("");
  const [debouncedWindraw, maxWindraw, setDebounceWindraw] =
    useDebounce<number>(0, 500);
  const [debouncedDebt, maxDebt, setDebounceDebt] = useDebounce<number>(0, 500);
  const [windrawHealth, setWindrawHealth] = useState<number>(0);
  const [debtHealth, setDebtHealth] = useState<number>(0);

  useEffect(() => {
    // Kada iz url-a stigne CDP ID, taj CDP izvlaci se iz array-a i pomocu njega kreira novi object sa vrednostima koje treba prikazatii
    let createDisplayCdp = async () => {
      let id = router.query.id;
      let index = cdpArray.findIndex(x => x["id"] == id);
      if (index >= 0) {
        populatePage(cdpArray[index]);
      } else getNewCdp(id);
    };

    // Ako u arrayu nije pronadjen CDP (nova strana/browser) kreira se novi kao prilikom pretrage
    const getNewCdp = async (id: any) => {
      let { cdp } = await getCdp(id, vaultContract, web3);
      populatePage(cdp);
    };

    const populatePage = async (cdpObject: any) => {
      // U handleCdp funkciji se obavlja vecina kalkulacija
      const returnedObj = await handleCdp(cdpObject, interestRatesContract);
      setWindrawHealth(parseFloat(returnedObj.healthAfterWindraw));
      setDebtHealth(parseFloat(returnedObj.healthAfterMaxDebt));
      setCdp(returnedObj);
    };
    if (router.isReady && interestRatesContract) {
      createDisplayCdp();
    }
  }, [
    cdpArray,
    router.isReady,
    interestRatesContract,
    // LINT SAVET
    router.query.id,
    vaultContract,
    web3,
  ]);

  const requestSignature = async () => {
    const message = "Ovo je moj CDP";
    var accounts = await web3.eth.getAccounts();
    const signature = await web3.eth.personal.sign(
      message,
      accounts[0],
      "password?"
    );
    setMetamaskSignature(signature);
  };

  // Racunanje debt i windrawn potencijalnih pozicija
  // Hteo sam na jednom mestu da drzim deo zajednickog koda, a onda me linter upozorio da se funkcija rekreira svaki put kada i komponenta, pa koristim useCallback
  const healthComputation = useCallback(
    (ratio: number, callback: Function) => {
      let positionHealth = 100 - (cdp.liquidationPercent * 100) / ratio;
      callback(positionHealth.toFixed(2));
    },
    [cdp.liquidationPercent]
  );
  useEffect(() => {
    if (maxWindraw) {
      let ratio = ((cdp.usd - maxWindraw) * 100) / cdp.displayDebt;
      healthComputation(ratio, setWindrawHealth);
    }
  }, [
    debouncedWindraw,
    cdp.usd,
    cdp.displayDebt,
    healthComputation,
    maxWindraw,
  ]);

  useEffect(() => {
    if (maxDebt) {
      let ratio = (cdp.usd * 100) / maxDebt;
      healthComputation(ratio, setDebtHealth);
    }
  }, [debouncedDebt, cdp.usd, healthComputation, maxDebt]);

  // Nisam imao jasnu ideju kako ovu komponentu da razdvojim na delove, niti kako da dinamicki renderujem celine podataka, jer iako su slicne, imaju dosta razlicitih funkcionalnosti
  return (
    <Container
      minHeight={"100vh"}
      color={"#fff"}
      width={"100%"}
      maxWidth={"none"}
      padding={{ base: "50px 20px", lg: 100, md: 50 }}
      bgGradient="linear(to-t, #2c3e50, #34495e)"
    >
      {cdp.id > 0 && (
        <Box maxWidth={1200} margin="auto">
          {metaMaskSignature && (
            <Text
              bg="rgba(26, 188, 156, 0.2)"
              padding="20px"
              marginBottom="50px"
            >
              {metaMaskSignature}
            </Text>
          )}
          <Flex
            w="100%"
            background="#2c3e50"
            padding="20px"
            justifyContent="space-between"
            alignItems="center"
            wrap="wrap"
          >
            <Flex
              w={{ base: "100%", md: "auto" }}
              justifyContent={{ base: "space-between", md: "flex-start" }}
            >
              <MetaMaskButton />

              {connected && (
                <Button
                  bg="#2c3e50"
                  _hover={{ bg: "#243342" }}
                  onClick={requestSignature}
                >
                  Ovo je moj CDP
                </Button>
              )}
            </Flex>
            <Box
              opacity={0.5}
              maxWidth="100%"
              margin={{ base: "20px 0", md: 0 }}
              padding={{ base: "20px 0", md: 0 }}
              border={{ base: "1px solid #ccc", md: 0 }}
              borderWidth={{ base: "1px 0", md: 0 }}
            >
              User address:
              <Link
                href={`https://etherscan.io/address/${cdp.userAddr}`}
                target="_blank"
                marginLeft="5px"
              >
                {cdp.userAddr}
              </Link>
            </Box>
            <Text opacity={0.5}>CDP ID: {cdp.id}</Text>
          </Flex>
          <Grid
            marginTop="50px"
            templateColumns={{
              base: `repeat(1, 1fr)`,
              md: `repeat(2, 1fr)`,
            }}
            gap={4}
          >
            <Stat background="#2c3e50" padding="20px">
              <StatLabel>Collateral:</StatLabel>
              <StatNumber>
                {cdp.displayCollateral}{" "}
                <Text as="span" fontSize="xs">
                  {cdp.collateralType}
                </Text>
              </StatNumber>
              <StatHelpText>${cdp.usd}</StatHelpText>
            </Stat>
            <Stat background="#2c3e50" padding="20px">
              <StatLabel>Debt:</StatLabel>
              <StatNumber>
                {cdp.displayDebt}{" "}
                <Text as="span" fontSize="xs">
                  DAI
                </Text>
              </StatNumber>
            </Stat>
            <Stat background="#2c3e50" padding="20px">
              <StatLabel>Collateralization ratio:</StatLabel>
              <StatNumber>{isNaN(cdp.ratio) ? 0 : `${cdp.ratio}%`}</StatNumber>
              {!isNaN(cdp.ratio) && (
                <StatHelpText>
                  Possition health:{" "}
                  <Text
                    fontWeight="bold"
                    as="span"
                    color={
                      cdp.positionHealth < 30
                        ? "red"
                        : cdp.positionHealth < 50
                        ? "#d35400"
                        : cdp.positionHealth > 90
                        ? "#1abc9c"
                        : "#f1c40f"
                    }
                  >
                    {cdp.positionHealth}%
                  </Text>
                </StatHelpText>
              )}
            </Stat>
            <Stat background="#2c3e50" padding="20px">
              <StatLabel>Liquidation ratio:</StatLabel>
              <StatNumber>{`${cdp.liquidationPercent}%`}</StatNumber>
              <StatHelpText>
                {cdp.collateralType} possition will be liquidated at this ratio
              </StatHelpText>
            </Stat>
            <Stat background="#2c3e50" padding="20px">
              <StatLabel>Windraw options:</StatLabel>
              <StatNumber>
                ${maxWindraw || cdp.maxWindraw}
                {(maxWindraw == parseFloat(cdp.maxWindraw) || !maxWindraw) && (
                  <Text as="span" fontSize="14px" fontWeight="normal">
                    {" "}
                    ~ MAX
                  </Text>
                )}
              </StatNumber>
              <StatHelpText>
                <Slider
                  aria-label="slider-max-windraw"
                  defaultValue={maxWindraw || cdp.maxWindraw}
                  max={cdp.maxWindraw}
                  min={1}
                  colorScheme="teal"
                  onChange={setDebounceWindraw}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </StatHelpText>
              {!isNaN(cdp.ratio) && (
                <StatHelpText>
                  Possition health after windraw:{" "}
                  <Text
                    fontWeight="bold"
                    as="span"
                    color={
                      windrawHealth < 30
                        ? "red"
                        : windrawHealth < 50
                        ? "#d35400"
                        : windrawHealth > 90
                        ? "#1abc9c"
                        : "#f1c40f"
                    }
                  >
                    {windrawHealth}%
                  </Text>
                </StatHelpText>
              )}
            </Stat>

            <Stat background="#2c3e50" padding="20px">
              <StatLabel>Debt options:</StatLabel>
              <StatNumber>
                ${maxDebt || cdp.maxDebt}{" "}
                {(maxDebt == parseFloat(cdp.maxDebt) || !maxDebt) && (
                  <Text as="span" fontSize="14px" fontWeight="normal">
                    {" "}
                    ~ MAX
                  </Text>
                )}
              </StatNumber>
              <StatHelpText>
                <Slider
                  aria-label="slider-max-debt"
                  onChange={setDebounceDebt}
                  defaultValue={maxDebt || cdp.maxDebt}
                  max={cdp.maxDebt}
                  min={1}
                  colorScheme="teal"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </StatHelpText>
              {!isNaN(cdp.ratio) && (
                <StatHelpText>
                  {/* <StatArrow type="decrease" /> */}
                  Possition health after debt adjusment:{" "}
                  <Text
                    fontWeight="bold"
                    as="span"
                    color={
                      debtHealth < 30
                        ? "red"
                        : debtHealth < 50
                        ? "#d35400"
                        : debtHealth > 90
                        ? "#1abc9c"
                        : "#f1c40f"
                    }
                  >
                    {debtHealth}%
                  </Text>
                </StatHelpText>
              )}
            </Stat>
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default Details;
