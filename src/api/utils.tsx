import { MenuItem } from "@chakra-ui/react";
import getInterestRates from "./getInterestRates";

// Ovo je pocelo kao ideja da postoji reusabilna funkcija, koja bi kreirala elemente, ali je ubrzo postal vrlo specificna
export const collateralTypeOptions = (
  handleMenuClick: Function,
  selected: string,
  ...args: any[]
) => {
  return args.map(opt => (
    <MenuItem
      key={opt}
      value={opt}
      isDisabled={selected == opt}
      onClick={() => handleMenuClick(opt)}
      background={selected == opt ? "#243342" : "#2c3e50"}
      _hover={{ bg: "#079992" }}
      _focus={{ bg: "#079992" }}
    >
      {opt}
    </MenuItem>
  ));
};

// Nisam nasao nacin da pomerim decimalu na odgovarajucu poziciju, pa sam pribegao ovom resenju. Sigurno postoji neki normalniji nacin
export const lameDecimal = (num: number, decimals: number) => {
  let leading = "0.";
  while (leading.length < decimals) {
    leading += "0";
  }
  leading += "1";
  let result = num * parseFloat(leading);
  return result;
};

type Cdp = {
  id: number;
  collateral: string;
  ilk: number;
  debt: number;
  userAddr: string;
  colType: string;
};

export const handleCdp = async (cdp: Cdp, interestRatesContract: any) => {
  let unitPrice = 0;
  let liquidationPercent = 0;
  let cdpCopy = cdp;
  let displayDebt = 0;
  switch (cdp.colType) {
    case "ETH-A":
      unitPrice = 1067.3;
      liquidationPercent = 145;
      break;
    case "WBTC-A":
      unitPrice = 19483.39;
      liquidationPercent = 145;
    case "USDC-A":
      unitPrice = 1;
      liquidationPercent = 101;
    default:
      break;
  }
  // Poziva se contract koji vraca iznos kamate za odredjeni collateral type
  const getDisplayCdp = async () => {
    let result = await getInterestRates(cdpCopy.ilk, interestRatesContract);
    let updatedDebt = result.interestRates * cdpCopy.debt;

    let debtWithInterestRate = lameDecimal(updatedDebt, 46);
    return parseFloat(debtWithInterestRate.toFixed(2));
  };

  displayDebt = await getDisplayCdp();
  let displayCollateral = lameDecimal(parseInt(cdpCopy.collateral), 19);
  let usd = displayCollateral * unitPrice;
  let ratio = (usd * 100) / displayDebt;
  let positionHealth = 100 - (liquidationPercent * 100) / ratio; // Ako je {liquidationPercent} 2% trenutnog {ratio} onda je {positionHealth} na 98%
  let maxWindraw = usd - (displayDebt / 100) * (liquidationPercent + 1); // Povecava se likvidacioni procenat za 1% (ETH-A 146% npr.), kako bi se izbegla automatska likvidacija
  let maxDebt = usd / ((liquidationPercent + 1) / 100);
  let windrawRatio = ((usd - maxWindraw) * 100) / displayDebt;
  let debtRatio = (usd * 100) / maxDebt;

  let healthAfterWindraw = 100 - (liquidationPercent * 100) / windrawRatio;
  let healthAfterDebt = 100 - (liquidationPercent * 100) / debtRatio;

  let displayCdp = {
    displayCollateral: displayCollateral.toFixed(2),
    displayDebt: displayDebt.toFixed(2),
    usd: usd.toFixed(2),
    ratio: ratio.toFixed(2),
    positionHealth: positionHealth.toFixed(2),
    userAddr: cdpCopy.userAddr,
    id: cdpCopy.id,
    collateralType: cdpCopy.colType,
    maxWindraw: maxWindraw.toFixed(2),
    maxDebt: maxDebt.toFixed(2),
    healthAfterWindraw: healthAfterWindraw.toFixed(2),
    healthAfterMaxDebt: healthAfterDebt.toFixed(2),
    liquidationPercent,
  };
  return displayCdp;
};
