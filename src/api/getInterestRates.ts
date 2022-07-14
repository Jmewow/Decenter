import { Contract } from "web3-eth-contract";

const getInterestRates = async (collateralType: any, contract: Contract) => {
  let interestRates = await contract.methods
    .ilks(collateralType)
    .call(function (err: any, res: any) {
      if (err) {
        console.log("An error occured", err);
        return;
      }
    });
  let rate = interestRates.rate;
  return {
    interestRates: rate,
  };
};
export default getInterestRates;
