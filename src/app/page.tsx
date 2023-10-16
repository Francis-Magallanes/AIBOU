"use client";
import { FC } from "react";
import { Navbar } from "./components/Navbar";
import { ProcessFile } from "./components/ProcessFile";
import { Box, VStack } from "@chakra-ui/react";

const heightNavbarPercent = 10;

const Home: FC = () => {
  return (
    <>
      <VStack>
        <Box
          h={`${heightNavbarPercent}%`}
          w="100%"
          pos="static"
        >
          <Navbar />
        </Box>
        <Box
          h={`${100 - heightNavbarPercent}%`}
          w="100%"
        >
          <ProcessFile />
        </Box>
      </VStack>
    </>
  );
};

export default Home;
