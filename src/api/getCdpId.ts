const getCdp = async (
  cdpId: number,
  contract: any,
  web3: any,
  selectedColType: string = ""
) => {
  let cdpInfo = await contract.methods
    .getCdpInfo(cdpId)
    .call(function (err: any, res: any) {
      if (err) {
        console.log("An error occured", err);
        return;
      }
    });
  let colType = web3.utils.toAscii(cdpInfo.ilk).replace(/[^\x20-\x7E]/g, "");
  cdpInfo.colType = colType;
  cdpInfo.id = cdpId;
  return {
    sameType: cdpInfo.userAddr && selectedColType == colType,
    cdp: cdpInfo,
  };
};
export default getCdp;
