"use client";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  useDisclosure,
} from "@chakra-ui/react";

import {
  useRef,
  FC,
  useState,
  Dispatch,
  SetStateAction,
  ChangeEvent,
  DragEvent,
} from "react";

import { AiOutlineCloudUpload, AiFillCheckCircle } from "react-icons/ai";
import { VStack, Text, Button, Icon, Center, Box } from "@chakra-ui/react";

export { DocumentUpload };

interface DocumentUploadProps {
  validFileTypes: Array<string>;
  setFile: Dispatch<SetStateAction<File | undefined>>;
  width?: string;
  height?: string;
  fontSize?: string;
}

interface ModalInfo {
  title: string;
  content: string;
}

const DocumentUpload: FC<DocumentUploadProps> = ({
  validFileTypes,
  setFile,
  width = "50vw",
  height = "50vh",
  fontSize = "1.5rem",
}) => {
  const fileUploadRef = useRef<HTMLInputElement | null>(null);

  const {
    isOpen: isOpenModal,
    onOpen: onOpenModal,
    onClose: onCloseModal,
  } = useDisclosure();

  const [modalInfo, setModalInfo] = useState<ModalInfo>();

  const [isDropTextVisible, setDropTextVisible] = useState<boolean>(false);

  const [fileName, setFileName] = useState<string>("");

  const onSelectionFile = (event: ChangeEvent<HTMLInputElement>): void => {
    event.preventDefault();
    let fileName = "";
    if (event.currentTarget.files != null) {
      fileName = event.currentTarget.files[0].name;
    }
    setFileName(fileName);
    setFile(event.currentTarget.files?.[0]);
  };

  const onEnterFile = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    setDropTextVisible(true);
  };

  const onLeaveFile = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    setDropTextVisible(false);
  };

  const onDragFile = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onDropFile = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();

    setDropTextVisible(false);

    const files: File[] = [...event.dataTransfer?.files];

    if (!files) {
      return;
    }

    if (files.length > 1) {
      setModalInfo({
        title: "One file at a time",
        content: "The system can only process one file at a time",
      });
      onOpenModal();
      return;
    }

    if (!validFileTypes.some((item) => files[0].name.endsWith(item))) {
      setModalInfo({
        title: "Invalid File",
        content:
          "The system can only process file that ends with " +
          validFileTypes.toString(),
      });
      onOpenModal();
      return;
    }

    setFileName(files[0].name);
    setFile(files[0]);
  };

  return (
    <>
      <VStack alignItems="normal">
        <Box>
          <VStack
            w={width}
            h={height}
            borderStyle="dashed"
            borderColor="black"
            borderWidth="2px"
            justify="center"
            onDragEnter={onEnterFile}
            onDrop={onDropFile}
            hidden={isDropTextVisible}
          >
            <Icon
              as={AiOutlineCloudUpload}
              boxSize="5rem"
            />
            <Text fontSize={fontSize}>Drag and Drop to Upload File Here</Text>
            <Text fontSize={fontSize}>Or</Text>
            <Button
              borderRadius="3px"
              size="lg"
              variant="outline"
              colorScheme="blue"
              onClick={() => fileUploadRef.current?.click()}
            >
              <input
                type="file"
                ref={fileUploadRef}
                accept={validFileTypes.toString()}
                onChange={onSelectionFile}
                hidden
              />
              Browse Files
            </Button>
          </VStack>

          <Center
            w={width}
            h={height}
            hidden={!isDropTextVisible}
            borderStyle="dashed"
            borderColor="black"
            borderWidth="2px"
            bgColor={"blue.50"}
            onDragLeave={onLeaveFile}
            onDrop={onDropFile}
            onDragOver={onDragFile}
          >
            <Text fontSize={fontSize}>Drop the File</Text>
          </Center>
        </Box>
        <Text hidden={fileName === ""}>
          File to be Processed: <i>{fileName}</i>{" "}
          <Icon
            as={AiFillCheckCircle}
            color="green.300"
            boxSize="1rem"
          />
        </Text>
      </VStack>

      <Modal
        isOpen={isOpenModal}
        onClose={onCloseModal}
        closeOnOverlayClick={false}
        blockScrollOnMount={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{modalInfo?.title}</ModalHeader>
          <ModalBody>{modalInfo?.content}</ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={onCloseModal}
            >
              Ok
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
