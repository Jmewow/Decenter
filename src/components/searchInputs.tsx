import { useEffect, useContext, useRef, useState } from "react";
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
  const firstMount = useRef<boolean>(false);
  const cachedId = useRef<any>();
  const { web3 } = useContext(MetaMaskContext);
  // Ako se trazi id koji nije u blizini, npr. WBC-A uz input 1, progress bar se nece mrdati, pa pokazujemo i id-eve pretrazenih CDP-ova, cisto da user dobije neki feedback
  const [progressInfo, setProgressInfo] = useState("");
  const [localCdpId, setLocalCdpId] = useState(contextCdpId);

  useEffect(() => {
    // Morao sam da napravim poseban effect da bi input imao odgovarajuci value i prilikom refresovanja strane
    if (firstMount.current) {
      setLocalCdpId(cdpId);
    } else firstMount.current = true;
  }, [cdpId]);

  useEffect(() => {
    let frame: number;
    // Preskace se izvodnjenje ovog bloka prilikom mountovanja komponente, da bih izbegao pretragu bez podataka, ili pretragu podataka koje vec imamo
    // Ceo ovaj if statement je malo preteran, ali nisam nasao bolji nacin da ukljucim array dependencije i da se blok izvodi samo kada se debouncovana vrednost promeni
    if (
      firstMount.current &&
      cdpId &&
      cdpId == debouncedCdpId &&
      contract &&
      web3
    ) {
      const asyncWrapper = async () => {
        setSearchError("");

        // Ako je pretraga zavrsena i ponovo porkenuta, CDP array se resetuje
        if (!searchInProgress) setcdpArray([]);
        setSearchInProgress(true);
        setCdpId(cdpId);

        let parsedCdpId = parseInt(cdpId);
        let maxCdpId: number = parsedCdpId;
        let minCdpId: number = parsedCdpId;

        let n = 0;
        let matchCounter = 0;
        let missmatchCounter = 0;

        let start: number;
        let done = false;
        let i = 0;

        //------------------------------------------- STEP START ------------------------------------------//

        // Za ovo bas nisam siguran. Probao sam setTimeout i setInterval. SetTimeout je bio previse spor, a setInterval brz, ali nepredvidiv, zbog asinhrone prirode, ubacujuci vise elemenata u array cak i kad ga zaustavim. Ovo se desava kada se u sred pretrage ukuca drugi id
        // requestAnimationFrame mi deluje kao hack, ali mi je dao srednju brzinu uz dobru pouzdanost. Ako ne bih prikazivao ubacivanje elemenata u array na ekranu, vec samo krajnji rezultat, mogao bih da koristim setInterval i sredim CDP array pre prikazivanja
        // Jedna od nuspojava requestAnimationFrame-a je da je pretraga pauzirana dok je korisnik na drugom tabu

        const step = async (timestamp: number) => {
          // Ako se u sred pretrage promeni CDP id, resetuj search
          if (cachedId.current && cachedId.current !== cdpId) {
            setcdpArray([]);
            cancelAnimationFrame(frame);
            return;
          }
          if (start === undefined) {
            start = timestamp;
          }
          const elapsed = timestamp - start;

          if (elapsed >= 200) {
            i++;
            start = timestamp;

            // Trazi jedan ID iznad, pa zatim ispod unesenog, kako bi nasao skup najblizih. Daje prednost vecem broju
            if (
              maxCdpId == parsedCdpId ||
              parsedCdpId - minCdpId >= maxCdpId - parsedCdpId ||
              minCdpId == 0
            ) {
              if (i > 1) maxCdpId++;
              n = maxCdpId;
            } else {
              minCdpId--;
              n = minCdpId;
            }
            // Poziva contract-ovu getCdpInfo funkciju
            let { cdp, sameType } = await getCdp(
              n,
              contract,
              web3,
              collateralType
            );
            setProgressInfo(cdp.id);

            // Ako je vraceni CDP collateral type istog tipa kao odabrani, dodaje se u CDP array, koji se onda prikazuje na ekranu
            if (sameType) {
              matchCounter++;
              missmatchCounter = 0;
              if (matchCounter <= resultsLength) {
                setcdpArray((cdpArray: any) => [...cdpArray, cdp]);
              } else {
                done = true;
              }
            } else {
              // Ako je contract pozvan 50 puta, bez poklapanja pretrage, prekida se pretraga i pokazuje poruka
              missmatchCounter++;
              if (missmatchCounter >= 50) {
                setSearchError(
                  "Search is taking too long. Please enter different CDP ID, or change collateral type."
                );
                done = true;
                endSearch();
              }
            }
          }

          if (matchCounter < resultsLength && !done) {
            window.requestAnimationFrame(step);
          } else {
            endSearch();
          }
        };
        const endSearch = () => {
          setSearchInProgress(false);
        };
        frame = window.requestAnimationFrame(step);
        cachedId.current = cdpId;
        // -------------------------------------------- STEP END -------------------------------------------//
      };
      asyncWrapper();
    } else {
      firstMount.current = true;
    }
    () => cancelAnimationFrame(frame);
    // Zbog ovoga sam morao da iskljucim linter ( ignoreDuringBuilds: true >> next.config.js), jer me terao da ukljucim setState u dependency array, sto je uzrokovalo rerenderovanje, a React dokumentacija tvrdi da za tim nema potrebe
    // "React guarantees that setState function identity is stable and won’t change on re-renders. This is why it’s safe to omit from the useEffect or useCallback dependency list."
  }, [debouncedCdpId, collateralType, resultsLength, cdpId, contract, web3]);

  const handleCollateralType = (type: string) => {
    setCollateralType(type);
  };
  return (
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
        // defaultValue={contextCdpId}
        value={localCdpId}
        type="text"
        placeholder="Search"
        background={"#2c3e50"}
        border={0}
        disabled={collateralType == "Collateral type"}
        onChange={e =>
          // Ovaj regex uklanja prazna polja, nule na pocetku i sve osim brojeva
          setCdpIdValue(e.target.value.replace(/^$|^0+/, "").replace(/\D/g, ""))
        }
      />
    </Flex>
  );
};

export default SearchInput;
