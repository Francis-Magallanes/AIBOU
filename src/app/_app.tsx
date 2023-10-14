"use client";
import { ChakraProvider } from "@chakra-ui/provider";
import { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
