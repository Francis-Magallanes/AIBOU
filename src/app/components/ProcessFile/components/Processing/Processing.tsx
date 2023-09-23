"use client";
import { FC, useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { VStack, Spinner, Heading } from "@chakra-ui/react";
import { ServiceConfig } from "../ChooseService";
import { processFile, Questionaire } from "./index";

export { Processing, type ProcessingOutput };

interface ProcessingProps {
	file: File | undefined;
	serviceConfig: ServiceConfig;
	setProcessingOutput: Dispatch<SetStateAction<ProcessingOutput | undefined>>;
	width?: string;
	height?: string;
	fontSize?: string;
}

interface ProcessingOutput {
	typeOfService: ServiceConfig["typeOfService"];
	output: Questionaire | string;
}
//TODO: Fix the changing waiting message bug. The waiting message doesn't change after the indicated interval
const arrayDisplayWaitingMessage = [
	"Please wait as your file is being processed.",
	"Your file is currently processed.",
	"The processing of file will be finished in a moment.",
	"Patience is the key.",
];

const Processing: FC<ProcessingProps> = ({
	file,
	serviceConfig: serviceType,
	setProcessingOutput,
	width = "100%",
	height = "100%",
	fontSize = "1rem",
}) => {
	const [displayWaitingMessage, setDisplayWaitingMessage] = useState<string>(
		arrayDisplayWaitingMessage[0]
	);

	useEffect(() => {
		const changingWaitingMessageTimer = setTimeout(() => {
			setDisplayWaitingMessage((prevItem) => {
				const newItem = arrayDisplayWaitingMessage.shift() ?? prevItem;
				arrayDisplayWaitingMessage.push(newItem);
				return newItem;
			});
		}, 1000);
		const abortController = new AbortController();
		if (file) {
			processFile(file, serviceType, abortController.signal)
				.then((data) => {
					// console.log(data);
					if (data) {
						setProcessingOutput({
							typeOfService: serviceType.typeOfService,
							output: data,
						} satisfies ProcessingOutput);
					}
				})
				.catch((error) => console.error(error));
		}

		return () => {
			abortController.abort();
			clearTimeout(changingWaitingMessageTimer);
		};
	}, []);

	return (
		<>
			<VStack gap="2rem" alignItems="center" justifyContent="center" width={width} height={height}>
				<Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />
				<Heading size="md">{displayWaitingMessage}</Heading>
			</VStack>
		</>
	);
};
