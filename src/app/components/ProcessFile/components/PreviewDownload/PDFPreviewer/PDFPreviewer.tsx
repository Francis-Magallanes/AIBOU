"use client";
import { Box, Button, ButtonGroup, Progress, Text, VStack } from "@chakra-ui/react";
import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsAPI from "pdfjs-dist/types/src/display/api";
import { FC, useEffect, useState } from "react";

export { PDFPreviewer };

interface PDFPreviewerProps {
	pdfFile: ArrayBuffer;
	width?: string;
	height?: string;
	fontSize?: string;
}

interface PDFPageInfo {
	currentPage: number;
	maxPages: number;
}

//TODO: Add Zoom In and Out Functionality, and inputting of page number for better navigation

let pdfDocProxy: pdfjsLib.PDFDocumentProxy;

const PDFPreviewer: FC<PDFPreviewerProps> = ({
	pdfFile,
	width = "100%",
	height = "100%",
	fontSize = "1rem",
}) => {
	// const heightNum = height?.match(/[0-9]+/g)?.[0];
	// const heightUnit = height?.match(/(?![0-9]+)\w{2,}/g)?.[0];

	const [isRenderingPage, setIsRenderingPage] = useState<boolean>(true);
	const [pageInfo, setPageInfo] = useState<PDFPageInfo>({ currentPage: 0, maxPages: 0 });

	const renderPage = async (pdfDocProxy: pdfjsAPI.PDFDocumentProxy, pageNum: number) => {
		setIsRenderingPage(true);
		setPageInfo((prevItem) => ({ ...prevItem, currentPage: pageNum }));

		const page = await pdfDocProxy.getPage(pageNum);
		const scale = 1.5;
		const viewport = page.getViewport({ scale: scale });

		const outputScale = window.devicePixelRatio ?? 1;

		const canvas = document.getElementById("pdfCanvas") as HTMLCanvasElement;
		const context = canvas.getContext("2d");

		canvas.width = Math.floor(viewport.width * outputScale);
		canvas.height = Math.floor(viewport.height * outputScale);
		canvas.style.width = String(Math.floor(viewport.width)) + "px";
		canvas.style.height = String(Math.floor(viewport.height)) + "px";

		const renderContext = {
			canvasContext: context!,
			viewport: viewport,
		};
		setIsRenderingPage(false);
		page.render(renderContext);
	};

	const nextPageOnClick = () => {
		void renderPage(pdfDocProxy, ++pageInfo.currentPage);
	};

	const previousPageOnClick = () => {
		void renderPage(pdfDocProxy, --pageInfo.currentPage);
	};
	useEffect(() => {
		const loadAndRenderPDF = async (pdfFile: ArrayBuffer) => {
			pdfDocProxy = await pdfjsLib.getDocument(pdfFile).promise;
			setPageInfo({ currentPage: 0, maxPages: pdfDocProxy.numPages });
			await renderPage(pdfDocProxy, 1);
			// console.log("finished rendering");
		};

		void loadAndRenderPDF(pdfFile);
	}, []);
	return (
		<VStack overflow="auto" width={width} height={height} backgroundColor="gray.200" gap={0}>
			<ButtonGroup
				position="sticky"
				top={0}
				left={0}
				backgroundColor="white"
				padding={"15px"}
				width={"100%"}
				justifyContent={"center"}
			>
				<Button
					colorScheme="blue"
					size={"xs"}
					hidden={pageInfo.currentPage === 1}
					onClick={previousPageOnClick}
				>
					Previous Page
				</Button>
				<Text fontSize={"md"}>
					Page {pageInfo.currentPage} out of {pageInfo.maxPages}
				</Text>
				<Button
					colorScheme="blue"
					size={"xs"}
					hidden={pageInfo.currentPage === pageInfo.maxPages}
					onClick={nextPageOnClick}
				>
					Next Page
				</Button>
			</ButtonGroup>
			{isRenderingPage && (
				<Box width={"100%"}>
					<Progress colorScheme="blue" size="md" isIndeterminate={true} />
				</Box>
			)}
			<canvas id="pdfCanvas" style={{ margin: "20px 0px" }}></canvas>
		</VStack>
	);
};
