import { createContext, useEffect, useState } from "react";

export const CdpContext = createContext({
  cdpId: "",
  cdpArray: [],
  collateralType: "",
  resultsLength: 5,
  searchInProgress: false,
  searchError: "",
  setCdpId: (val: string) => {},
  setcdpArray: (val: any) => {},
  setSearchInProgress: (val: boolean) => {},
  setCollateralType: (val: string) => {},
  setSearchError: (val: string) => {},
});

const CdpContextProvider = (props: any) => {
  const [cdpId, setCdpId] = useState("");
  const [cdpArray, setcdpArray] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [searchInProgress, setSearchInProgress] = useState(false);
  const [collateralType, setCollateralType] = useState("Collateral type");

  useEffect(() => {
    if (localStorage.getItem("cdpId"))
      setCdpId(localStorage.getItem("cdpId") || "");
    if (localStorage.getItem("collateralType"))
      setCollateralType(localStorage.getItem("collateralType") || "");
    if (localStorage.getItem("cdpArray"))
      setcdpArray(JSON.parse(localStorage.getItem("cdpArray") || ""));
  }, []);

  useEffect(() => {
    localStorage.setItem("cdpId", cdpId);
  }, [cdpId]);

  useEffect(() => {
    localStorage.setItem("cdpArray", JSON.stringify(cdpArray));
  }, [cdpArray]);

  useEffect(() => {
    localStorage.setItem("collateralType", collateralType);
  }, [collateralType]);

  return (
    <CdpContext.Provider
      value={{
        cdpId,
        cdpArray,
        collateralType,
        resultsLength: 20,
        searchError,
        searchInProgress,
        setCdpId: (val: string) => setCdpId(val),
        setcdpArray: val => setcdpArray(val),
        setSearchInProgress: val => setSearchInProgress(val),
        setCollateralType: (val: string) => setCollateralType(val),
        setSearchError: (val: string) => setSearchError(val),
      }}
    >
      {props.children}
    </CdpContext.Provider>
  );
};
export default CdpContextProvider;
