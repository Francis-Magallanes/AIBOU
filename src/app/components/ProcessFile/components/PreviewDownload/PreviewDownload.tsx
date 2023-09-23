"use client";
import { FC, useState, useEffect } from "react";
import { ProcessingOutput } from "../Processing";
import {
	VStack,
	HStack,
	Center,
	Heading,
	RadioGroup,
	Radio,
	Text,
	Button,
	Drawer,
	DrawerBody,
	DrawerHeader,
	DrawerOverlay,
	DrawerContent,
	DrawerCloseButton,
	useDisclosure,
} from "@chakra-ui/react";
import { createPDF } from ".";
import { jsPDF } from "jspdf";
import { PDFPreviewer } from "./PDFPreviewer";

export { PreviewDownload };

interface PreviewDownloadProps {
	processingOutput: ProcessingOutput | undefined;
	width?: string;
	height?: string;
	fontSize?: string;
}

type AvailableSaveFileType = "PDF" | "TEXT";
let pdf: jsPDF;

const PreviewDownload: FC<PreviewDownloadProps> = ({
	processingOutput,
	width = "50vw",
	height = "50vh",
	fontSize = "1.5rem",
}) => {
	// const heightNum = height?.match(/[0-9]+/g)?.[0];
	// const heightUnit = height?.match(/(?![0-9]+)\w{2,}/g)?.[0];
	const [saveFileType, setSaveFileType] = useState<AvailableSaveFileType>("PDF");
	const [isCreatingPDFFinished, setIsCreatingPDFFinished] = useState<boolean>(false);

	const {
		isOpen: isOpenPDFViewer,
		onOpen: onOpenPDFViewer,
		onClose: onClosePDFViewer,
	} = useDisclosure();

	const saveFile = () => {
		if (saveFileType === "PDF") {
			pdf.save();
		}
	};

	useEffect(() => {
		if (processingOutput) {
			pdf = createPDF(processingOutput).output();
			// console.log(processingOutput);
			setIsCreatingPDFFinished(true);
		}
	}, []);
	return (
		<>
			{processingOutput && (
				<VStack
					gap="1rem"
					alignItems="center"
					justifyContent="center"
					width={width}
					height={height}
				>
					<Heading marginBottom={"3rem"} size="lg">
						Preview and Saving of File
					</Heading>
					<Text fontSize="xl">Save File As: </Text>
					<RadioGroup
						onChange={(e) => {
							setSaveFileType(e as AvailableSaveFileType);
						}}
						value={saveFileType}
					>
						<HStack>
							<Radio value="PDF">
								<Text fontSize={"xl"}>PDF</Text>
							</Radio>
							<Radio value="TEXT">
								<Text fontSize={"xl"}>Text</Text>
							</Radio>
						</HStack>
					</RadioGroup>

					<Button
						onClick={onOpenPDFViewer}
						colorScheme="blue"
						isLoading={!isCreatingPDFFinished}
						loadingText="Creating Preview"
						width={"10rem"}
					>
						Open Preview
					</Button>
					<Button
						colorScheme="blue"
						width={"10rem"}
						onClick={() => {
							saveFile();
						}}
					>
						Save
					</Button>
					{isCreatingPDFFinished && (
						<Drawer isOpen={isOpenPDFViewer} onClose={onClosePDFViewer} size="full">
							<DrawerOverlay />
							<DrawerContent>
								<DrawerCloseButton size="lg" />
								<DrawerHeader fontSize="2xl">Preview of the Output in PDF Format</DrawerHeader>
								<DrawerBody>
									<PDFPreviewer pdfFile={pdf.output("arraybuffer")} />
								</DrawerBody>
							</DrawerContent>
						</Drawer>
					)}
				</VStack>
			)}

			{!processingOutput && (
				<Center>
					<Heading size="md">
						{"Sorry, the file didn't processed properly. Try processing the same file again"}.
					</Heading>
				</Center>
			)}
		</>
	);
};
