import { useEffect, useContext, useRef, useState, Fragment } from "react";
import { CdpContext } from "../contexts/cdpContext";
import MetaMaskButton from "./metaMaskButton";
import { MetaMaskContext } from "../contexts/metaMaskContext";
import { collateralTypeOptions } from "../api/utils";
import { useDebounce } from "../customHooks/useDebounce";
import getCdp from "../api/getCdpId";
import useContract from "../customHooks/useContract";
import vaultInfoAbi from "../abi/vaultInfo_abi";
// Koristio sam Chakra UI za stilizovanje, jer sam u nekom trenutku poceo da panicim zbog vremena, ali nisam presrecan resenjem,
// tj. verovatno nisam iskoristio ceo potencijal biblioteke posto sam stilove po potrebi definisao na svakom elementu...
import {
  Menu,
  MenuButton,
  MenuList,
  Button,
  Flex,
  Spacer,
  Input,
} from "@chakra-ui/react";

const SearchInput = () => {
  const [debouncedCdpId, cdpId, setCdpIdValue] = useDebounce<string>("", 1000);
  const contract = useContract(
    "0x68C61AF097b834c68eA6EA5e46aF6c04E8945B2d",
    vaultInfoAbi
  );
  const {
    cdpId: contextCdpId,
    setcdpArray,
    setCdpId,
    setCollateralType,
    collateralType,
    resultsLength,
    setSearchInProgress,
    setSearchError,
    searchInProgress,
  } = useContext(CdpContext);
  const { web3 } = useContext(MetaMaskContext);

  const firstMount = useRef<boolean>(false);
  const cachedId = useRef<any>();
  const progress = useRef<number>(0);

  // Ako se trazi id koji nije u blizini, npr. WBC-A uz input 1, progress bar se nece mrdati, pa pokazujemo i id-eve pretrazenih CDP-ova, cisto da user dobije neki feedback
  const [progressInfo, setProgressInfo] = useState("");
  const [localCdpId, setLocalCdpId] = useState(contextCdpId);

  useEffect(() => {
    // Morao sam da napravim poseban effect da bi input imao odgovarajuci value i prilikom refresovanja strane
    if (firstMount.current) {
      setLocalCdpId(cdpId);
    } else firstMount.current = true;
    progress.current = 0;
  }, [cdpId]);

  useEffect(() => {
    progress.current = 0;
    let interval: any;
    // Preskace se izvodnjenje ovog bloka prilikom mountovanja komponente, da bih izbegao pretragu bez podataka, ili pretragu podataka koje vec imamo
    // Ceo ovaj if statement je malo preteran, ali nisam nasao bolji nacin da ukljucim array dependencije i da se blok izvodi samo kada se debouncovana vrednost promeni
    if (
      firstMount.current &&
      cdpId &&
      cdpId == debouncedCdpId &&
      contract &&
      web3
    ) {
      setSearchError("");

      // Ako je pretraga zavrsena i ponovo porkenuta, CDP array se resetuje
      setcdpArray([]);
      setSearchInProgress(true);
      setCdpId(cdpId);

      let parsedCdpId = parseInt(cdpId);
      let maxCdpId: number = parsedCdpId;
      let minCdpId: number = parsedCdpId;

      let n = 0;
      let matchCounter = 0;
      let missmatchCounter = 0;

      let i = 0;
      const newCdpArray = new Array(resultsLength);
      let start = performance.now();
      interval = setInterval(async () => {
        // Ako se u sred pretrage promeni CDP id, resetuj search
        if (cachedId.current && cachedId.current !== cdpId) {
          clearInterval(interval);
        }
        // Trazi se jedan ID iznad, pa zatim ispod unesenog, kako bi se pronasao skup najblizih. Daje se prednost vecem broju
        if (
          maxCdpId == parsedCdpId ||
          parsedCdpId - minCdpId >= maxCdpId - parsedCdpId ||
          minCdpId == 0
        ) {
          if (i > 0) maxCdpId++;
          n = maxCdpId;
        } else {
          minCdpId--;
          n = minCdpId;
        }
        i++;
        // Poziva se contract-ova getCdpInfo funkcija
        let { cdp, sameType } = await getCdp(n, contract, web3, collateralType);
        setProgressInfo(cdp.id);

        const then = performance.now();
        // Ako je vraceni CDP collateral type istog tipa kao odabrani, dodaje se u CDP array, koji se onda prikazuje na ekranu
        if (sameType) {
          if (matchCounter < resultsLength) {
            newCdpArray[matchCounter] = cdp;
          } else {
            // Zavrsena pretraga
            setcdpArray(newCdpArray);
            endSearch();
          }
          matchCounter++;
          if (progress.current == 0 && matchCounter > 1) {
            clearInterval(interval);
          } else progress.current = matchCounter;

          missmatchCounter = 0;
        } else {
          // Ako je contract pozvan 50 puta, bez poklapanja pretrage, prekida se pretraga i pokazuje poruka
          missmatchCounter++;
          if (missmatchCounter >= 50) {
            setcdpArray(newCdpArray);
            setSearchError(
              "Search is taking too long. Please enter different CDP ID, or change collateral type."
            );
            endSearch();
          }
        }
      }, 220);

      const endSearch = () => {
        setSearchInProgress(false);
        clearInterval(interval);
      };

      cachedId.current = cdpId;
    } else {
      firstMount.current = true;
    }
    () => clearInterval(interval);
    // Zbog ovoga sam morao da iskljucim linter ( ignoreDuringBuilds: true >> next.config.js), jer me terao da ukljucim setState u dependency array, sto je uzrokovalo rerenderovanje, a React dokumentacija tvrdi da za tim nema potrebe
    // "React guarantees that setState function identity is stable and won’t change on re-renders. This is why it’s safe to omit from the useEffect or useCallback dependency list."
  }, [debouncedCdpId, collateralType, resultsLength, cdpId, contract, web3]);

  const handleCollateralType = (type: string) => {
    setCollateralType(type);
  };
  return (
    <Fragment>
      <Flex>
        <MetaMaskButton />

        <Spacer />
        <Menu isLazy lazyBehavior="keepMounted" autoSelect={false}>
          <MenuButton
            margin={"0 10px"}
            background={"#2c3e50"}
            as={Button}
            border={0}
            width={220}
            disabled={searchInProgress}
            _focus={{ bg: "#2c3e50" }}
            _hover={{ bg: "#243342" }}
            _expanded={{ bg: "#243342" }}
          >
            {searchInProgress ? progressInfo : collateralType}
          </MenuButton>
          <MenuList background={"#2c3e50"} border={0}>
            {collateralTypeOptions(
              (type: string) => handleCollateralType(type),
              collateralType,
              "ETH-A",
              "WBTC-A",
              "USDC-A"
            )}
          </MenuList>
        </Menu>
        <Spacer />
        <Input
          value={localCdpId}
          type="text"
          placeholder={
            collateralType == "Collateral type"
              ? "Please select collateral type"
              : "Enter CDP ID"
          }
          background={"#2c3e50"}
          border={0}
          disabled={collateralType == "Collateral type"}
          onChange={e =>
            // Ovaj regex uklanja prazna polja, nule na pocetku i sve osim brojeva
            setCdpIdValue(
              e.target.value.replace(/^$|^0+/, "").replace(/\D/g, "")
            )
          }
        />
      </Flex>
      {true && (
        <div
          style={{
            position: "relative",
            height: 1.3,
            width: "100%",
            background: "#2c3e50",
            overflow: "hidden",
            margin: "20px 0",
          }}
        >
          <div
            style={{
              width: `${(progress.current / resultsLength) * 100}%`,
              background: `${
                searchInProgress
                  ? progress.current < resultsLength / 2
                    ? "red"
                    : "#f39c12"
                  : "teal"
              }`,
              height: 1.3,
              transition: `all ${progress.current < 2 ? 0 : 0.2}s linear`,
              position: "absolute",
              top: 0,
              left: 0,
              display: `${progress.current == 0 ? "none" : "block"}`,
            }}
          ></div>
        </div>
      )}
    </Fragment>
  );
};

export default SearchInput;
