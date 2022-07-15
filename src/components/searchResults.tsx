import { Fragment, useContext } from "react";
import { CdpContext } from "../contexts/cdpContext";
import Link from "next/link";
import {
  Center,
  Fade,
  Progress,
  Container,
  Grid,
  GridItem,
  Skeleton,
  Text,
} from "@chakra-ui/react";

// Styling koji se ponavlja
const gridGap = 3;
const gridElementHeight = "50px";
const gridTemplate = {
  base: "repeat(2, 1fr)",
  lg: "repeat(4, 1fr)",
  md: "repeat(3, 1fr)",
};

const Skelet = (cdpArray: any, resultsLength: number) => {
  const steps = new Array(resultsLength);
  for (let i = 1; i <= resultsLength; i++) {
    steps[i] = (
      <GridItem w="100%" h={gridElementHeight} key={i}>
        <Skeleton
          w={"100%"}
          h={"100%"}
          isLoaded={cdpArray.length >= i}
          startColor={"#2c3e50"}
          endColor={"#121a21"}
        />
      </GridItem>
    );
  }
  return (
    <Grid
      position={"absolute"}
      width={"100%"}
      top={0}
      templateColumns={gridTemplate}
      gap={gridGap}
    >
      {steps}
    </Grid>
  );
};

const SearchResults = () => {
  const { resultsLength, cdpArray, searchInProgress, searchError } =
    useContext(CdpContext);
  return (
    <Fragment>
      <Fade in={searchInProgress || !!cdpArray.length}></Fade>
      <Fade in={!!searchError}>
        {!!searchError && (
          <Text
            color="orange.300"
            fontSize="20px"
            textAlign="center"
            bg="#2c3e50"
            padding="20px"
            marginBottom="20px"
          >
            {searchError}
          </Text>
        )}
      </Fade>
      <Container position={"relative"} padding={0}>
        <Grid templateColumns={gridTemplate} gap={gridGap}>
          {cdpArray.map(item => (
            <GridItem
              h={gridElementHeight}
              w="100%"
              bg="#3c6382"
              key={item["id"]}
              _hover={{ bg: "#079992", cursor: "pointer" }}
            >
              <Link href={"cdpId/" + item["id"]}>
                <Center h="100%">{item["id"]}</Center>
              </Link>
            </GridItem>
          ))}
        </Grid>
        {searchInProgress && Skelet(cdpArray, resultsLength)}
      </Container>
    </Fragment>
  );
};

export default SearchResults;
