"use client";
import {
  ChangeEvent,
  FC,
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import {
  VStack,
  Text,
  Heading,
  Tabs,
  TabList,
  Tab,
  Radio,
  RadioGroup,
  Input,
} from "@chakra-ui/react";

export {
  ChooseService,
  type ServiceConfig,
  type ChooseServiceProps,
  type CreateQuestionaireConfig,
  type SummarizeConfig,
};

interface ServiceConfig {
  typeOfService: "CREATEQUESTIONAIRE" | "SUMMARIZE";
  config: CreateQuestionaireConfig | SummarizeConfig | undefined;
}

interface CreateQuestionaireConfig {
  typeOfAnswer: "SINGLE" | "MULTIPLE" | "BOOLEAN" | "ESSAY";
  numOfQuestions: number;
}

interface SummarizeConfig {
  typeOfSummary: "PARAGRAPH" | "BULLET";
  maxNumOfWords: number;
}

interface ChooseServiceProps {
  fileName: string; //* filename of the file that will be processed
  setOutputServiceConfig: Dispatch<SetStateAction<ServiceConfig>>;
  width?: string;
  height?: string;
}

const ChooseService: FC<ChooseServiceProps> = ({
  fileName,
  setOutputServiceConfig,
  width = "50vw",
  height = "50vh",
}) => {
  const [createQuestionaireConfig, setCreateQuestionaireConfig] =
    useState<CreateQuestionaireConfig>({
      typeOfAnswer: "SINGLE",
      numOfQuestions: 3,
    });

  const [summarizeConfig, setSummaryConfig] = useState<SummarizeConfig>({
    typeOfSummary: "PARAGRAPH",
    maxNumOfWords: 80,
  });

  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>({
    typeOfService: "CREATEQUESTIONAIRE",
    config: createQuestionaireConfig,
  } as ServiceConfig);

  useEffect(() => {
    setOutputServiceConfig(serviceConfig);
  }, [
    serviceConfig.typeOfService,
    ...Object.values(createQuestionaireConfig),
    ...Object.values(summarizeConfig),
  ]);

  const onChangeServiceTab = (index: number) => {
    const newServiceConfig = { ...serviceConfig };
    switch (index) {
      case 0:
        newServiceConfig.typeOfService = "CREATEQUESTIONAIRE";
        newServiceConfig.config = createQuestionaireConfig;
        break;
      case 1:
        newServiceConfig.typeOfService = "SUMMARIZE";
        newServiceConfig.config = summarizeConfig;
        break;
      default:
        newServiceConfig.typeOfService = "CREATEQUESTIONAIRE";
        newServiceConfig.config = createQuestionaireConfig;
    }
    setServiceConfig(newServiceConfig);
  };

  return (
    <>
      <VStack
        w={width}
        h={height}
        alignItems="normal"
      >
        <Text paddingBottom="0.5rem">
          File to be Processed: <i>{fileName}</i>
        </Text>
        <VStack gap="2rem">
          <Heading
            size="md"
            textAlign="center"
          >
            Choose <b>One</b> of the Services Offered and its configuration for
            the processing of file.
          </Heading>

          <Tabs
            variant="soft-rounded"
            colorScheme="blue"
            orientation="horizontal"
            onChange={onChangeServiceTab}
          >
            <Text
              textAlign="center"
              fontSize="lg"
            >
              Service Type:
            </Text>
            <TabList gap="1rem">
              <Tab>Create Questionaire</Tab>
              <Tab>Summarize</Tab>
            </TabList>
          </Tabs>

          {serviceConfig.typeOfService === "CREATEQUESTIONAIRE" && (
            <VStack gap="1rem">
              <RadioGroup
                onChange={(newValue: string) => {
                  setCreateQuestionaireConfig(
                    (prevConfig: CreateQuestionaireConfig) =>
                      ({
                        ...prevConfig,
                        typeOfAnswer: newValue,
                      }) as CreateQuestionaireConfig,
                  );
                  setServiceConfig((prevConfig) => ({
                    ...prevConfig,
                    config: {
                      ...(prevConfig.config as CreateQuestionaireConfig),
                      typeOfAnswer: newValue,
                    } as CreateQuestionaireConfig,
                  }));
                }}
                value={createQuestionaireConfig.typeOfAnswer}
              >
                <Text
                  textAlign="center"
                  fontSize="lg"
                >
                  Type of Answer for the Questions:
                </Text>
                <Radio
                  size="md"
                  padding="0rem 1rem"
                  value="SINGLE"
                >
                  Single Answer
                </Radio>
                <Radio
                  size="md"
                  padding="0rem 1rem"
                  value="MULTIPLE"
                >
                  Multiple Answers
                </Radio>
                <Radio
                  size="md"
                  padding="0rem 1rem"
                  value="BOOLEAN"
                >
                  True or False
                </Radio>
                <Radio
                  size="md"
                  padding="0rem 1rem"
                  value="ESSAY"
                >
                  Essay
                </Radio>
              </RadioGroup>

              <VStack>
                <Text
                  textAlign="center"
                  fontSize="lg"
                >
                  Number of Questions:
                </Text>

                {
                  // TODO: input validation of the number of question
                }
                <Input
                  type="number"
                  size="md"
                  defaultValue={createQuestionaireConfig.numOfQuestions}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setCreateQuestionaireConfig(
                      (prevConfig: CreateQuestionaireConfig) =>
                        ({
                          ...prevConfig,
                          numOfQuestions: parseInt(event.target.value) || 5,
                        }) as CreateQuestionaireConfig,
                    );
                    setServiceConfig((prevConfig) => ({
                      ...prevConfig,
                      config: {
                        ...(prevConfig.config as CreateQuestionaireConfig),
                        numOfQuestions: parseInt(event.target.value) || 5,
                      } as CreateQuestionaireConfig,
                    }));
                  }}
                  errorBorderColor="crimson"
                ></Input>
              </VStack>
            </VStack>
          )}

          {serviceConfig.typeOfService === "SUMMARIZE" && (
            <VStack>
              <RadioGroup
                onChange={(newValue: string) => {
                  setSummaryConfig(
                    (prevConfig) =>
                      ({
                        ...prevConfig,
                        typeOfSummary: newValue,
                      }) as SummarizeConfig,
                  );
                  setServiceConfig((prevConfig) => ({
                    ...prevConfig,
                    config: {
                      ...(prevConfig.config as SummarizeConfig),
                      typeOfSummary: newValue,
                    } as SummarizeConfig,
                  }));
                }}
                value={summarizeConfig.typeOfSummary}
              >
                <Text
                  textAlign="center"
                  fontSize="lg"
                >
                  Type of Summary:
                </Text>
                <Radio
                  size="md"
                  padding="0rem 1rem"
                  value="PARAGRAPH"
                >
                  Paragraph
                </Radio>
                <Radio
                  size="md"
                  padding="0rem 1rem"
                  value="BULLET"
                >
                  Bullet
                </Radio>
              </RadioGroup>

              <VStack>
                <Text
                  textAlign="center"
                  fontSize="lg"
                >
                  Number Maximum of Words:
                </Text>

                {
                  // TODO: add input validation of the number of question
                }
                <Input
                  type="number"
                  size="md"
                  defaultValue={summarizeConfig.maxNumOfWords}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setSummaryConfig(
                      (prevConfig) =>
                        ({
                          ...prevConfig,
                          maxNumOfWords: parseInt(event.target.value) || 20,
                        }) as SummarizeConfig,
                    );

                    setServiceConfig((prevConfig) => ({
                      ...prevConfig,
                      config: {
                        ...(prevConfig.config as SummarizeConfig),
                        maxNumOfWords: parseInt(event.target.value) || 20,
                      } as SummarizeConfig,
                    }));
                  }}
                  errorBorderColor="crimson"
                ></Input>
              </VStack>
            </VStack>
          )}
        </VStack>
      </VStack>
    </>
  );
};
