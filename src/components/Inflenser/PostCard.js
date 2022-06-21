import { Box, Text, Link, Image, Flex, Avatar, Button, Select, option, useMediaQuery } from '@chakra-ui/react';
import { InfoOutlineIcon, TriangleDownIcon, TriangleUpIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

import { useEffect, useState } from 'react';
import moment from 'moment';

import { uploadIpfs, uploadIpfsRedirect } from '../../lib/ipfs';
import IFramely from '../shared/IFramely/index.tsx';
import { useMirror } from '../../hooks/useMirror';
import { getPublicationURI } from '../../hooks/getPublicationURI';
import { useCampaignManager } from '../../hooks/useCampaignManager';
import { useCampaign } from '../../hooks/useCampaign';
import { useSharedState } from '../../context/store';
import { fetchPublication } from '../../hooks/usePublication';

export default function PostCard({ publicationId }) {
  const { createPost } = useMirror();
  const { getDefaultProfile } = getPublicationURI();
  const { getCampaigns, getUserScore } = useCampaignManager();
  const { getAdvertiserPayouts, getNumberOfActions, getCampaignInfo } = useCampaign();
  const [{ provider }] = useSharedState();

  const [publication, setPublication] = useState(<></>);
  const [linkExternal, setLinkExternal] = useState('');
  const [arrayJsxPost2, setArrayJsxPost2] = useState(<></>);
  const [settingState, useSettingState] = useState(false);
  const [statsState, setStatsState] = useState(false);
  const [userProfileId, setUserProfileId] = useState('');
  const [numberOfLines, setNumberOfLines] = useState(3);
  const [numberOfEvents, setNumberOfEvents] = useState(0);
  const [numberOfPosts, setNumberOfPosts] = useState(0);
  const [numberOfClicks, setNumberOfClicks] = useState(0);
  const [postPayout, setPostPayout] = useState(0);
  const [clickPayout, setClickPayout] = useState(0);
  const [actionPayout, setActionPayout] = useState(0);
  const [duration, setDuration] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [isLargerThan640] = useMediaQuery('(min-width: 640px)');
  let profileIdPostId = publicationId.split('-');

  const getUserProfileId = async () => {
    const userProfile = await getDefaultProfile();
    setUserProfileId(userProfile);
  };

  const getPub = async () => {
    const fetchedData = await fetchPublication(publicationId);

    setArrayJsxPost2(fetchedData.arrayJsxPost);
    setPublication(fetchedData.fetchedPublication);
    setLinkExternal(fetchedData.linkExternal);
  };

  const getData = async () => {
    const campaigns = await getCampaigns(profileIdPostId[0], profileIdPostId[1]);

    const numberOfAction = await getNumberOfActions(campaigns);
    const advertiserData = await getAdvertiserPayouts(campaigns);
    const campaignInfo = await getCampaignInfo(campaigns);
    let numberOfEventsSum = 0;
    let numberOfClicksSum = 0;

    for (let i = 0; i < numberOfAction.length; i++) {
      numberOfEventsSum += numberOfAction[i].events;
      numberOfClicksSum += numberOfAction[i].clicks;
    }
    setNumberOfEvents(numberOfEventsSum);
    setNumberOfClicks(numberOfClicksSum);
    setNumberOfPosts(numberOfAction.length);

    console.log('userScore');

    const userScore = await getUserScore(userProfileId);
    console.log('userscore', userScore);

    setPostPayout(Number(advertiserData[0]).toFixed(2) * userScore);
    setClickPayout(Number(advertiserData[3]).toFixed(2));
    setActionPayout(Number(advertiserData[6]).toFixed(2));

    setDuration(moment().to(moment.unix(Number(campaignInfo[3]) + Number(campaignInfo[2]))));
    const budget =
      Number(Number(advertiserData[2]).toFixed(2)) +
      Number(Number(advertiserData[5]).toFixed(2)) +
      Number(Number(advertiserData[8]).toFixed(2));
    setRemainingBudget(budget);
  };

  useEffect(() => {
    getPub();
    getUserProfileId();
  }, [provider]);

  useEffect(() => {
    getData();
  }, [provider]);

  const handleCreatePost = async () => {
    const content = publication.metadata.content;
    const campaignsAddress = await getCampaigns(profileIdPostId[0], profileIdPostId[1]);

    const url = content.match(/(((https?:\/\/)|(www\.))[^\s]+)/g) || [];
    const redirectObj = {
      urlToRedirect: url[0].slice(0, -1),
      inflenserId: userProfileId,
      campaignsAddress: campaignsAddress,
    };
    const redirectIpfs = await uploadIpfsRedirect(redirectObj);

    const urlIndex = content.indexOf(url[0]) || [];
    const newContent = `${content.substring(0, urlIndex)}https://lensbooster.xyz/redirect/${
      redirectIpfs.path
    }${content.substring(urlIndex + url[0].length - 1, content.length)}`;

    let publicationMetaData = JSON.parse(JSON.stringify(publication));
    publicationMetaData.metadata.content = `${newContent}\n\n #adv #lensbooster`;
    const ipfsContent = await uploadIpfs(publicationMetaData.metadata);
    await createPost(userProfileId.toHexString(), `https://ipfs.infura.io/ipfs/${ipfsContent.path}`, campaignsAddress);
  };

  return (
    <>
      {publication?.metadata && (
        <>
          <Flex
            bg="white"
            p={5}
            mt={5}
            borderRadius="20px"
            textAlign="left"
            color="black"
            minHeight="630px"
            display={{ base: 'block', md: 'flex' }}
          >
            <Box w={{ base: 'auto', md: '65%' }} fontSize="18px" mt={2}>
              <Flex marginBottom="1.5rem">
                <Avatar
                  src={
                    publication.profile.picture?.original?.url ||
                    'https://www.universodanza.org/wordpress/wp-content/uploads/2011/06/default-avatar.png'
                  }
                />
                <Box marginTop="auto" marginBottom="auto" marginLeft="1rem" fontSize="16px">
                  <Text fontWeight={600} fontFamily="'Prompt', sans-serif">
                    {publication.profile.name}
                  </Text>
                  <Link color="#1988F7" href={`https://lenster.xyz/u/${publication.profile.handle}`}>
                    @{publication.profile.handle}
                  </Link>
                </Box>
                <Box marginLeft="auto" color="#5C6F81" fontSize={15}>
                  {publication.createdAt && <Text whiteSpace="nowrap">{moment(publication.createdAt).fromNow()}</Text>}
                </Box>
              </Flex>
              <Text whiteSpace="pre-line" color="#00203F" w="90%" noOfLines={[numberOfLines, 1000]}>
                {arrayJsxPost2.map((e) => e)}
              </Text>
              {!isLargerThan640 && (
                <Button
                  mt="10px"
                  fontStyle="italic"
                  bg="white"
                  fontSize="15px"
                  onClick={() => (numberOfLines == 100 ? setNumberOfLines(3) : setNumberOfLines(100))}
                  _focus={{
                    boxShadow: '0 0 0 0 rgba(88, 144, 255, .75), 0 0 0 rgba(0, 0, 0, .15)',
                  }}
                  _hover={{ bg: 'white' }}
                  _active={{
                    bg: 'white',
                    transform: 'scale(1)',
                    borderColor: 'white',
                  }}
                  rightIcon={numberOfLines == 3 ? <ChevronDownIcon color="black" /> : <ChevronUpIcon color="black" />}
                  justifyContent="center"
                  marginLeft="auto"
                  paddingInlineStart={0}
                  paddingInlineEnd={0}
                >
                  {numberOfLines == 100 ? 'Show Less' : 'Show More'}
                </Button>
              )}
              {publication.metadata.media &&
                publication.metadata.media?.map((e) => {
                  return (
                    e?.original?.url && (
                      <Image marginTop="15px" w={{ base: '100%', md: '50%' }} src={e?.original?.url} />
                    )
                  );
                })}
              {linkExternal && (
                <Box width="100%">
                  <IFramely url={linkExternal} />
                </Box>
              )}
            </Box>
            <Box w={{ base: '100%', md: '35%' }} mt={{ base: 4, md: 2 }} position="relative">
              <Box
                marginLeft={{ base: 0, md: 5 }}
                mb={{ base: 4, md: 0 }}
                borderRadius={8}
                bg="#F0F3FA"
                fontWeight={500}
                h="fit-content"
                py={4}
              >
                <Box paddingLeft={6}>
                  <Flex gap="2">
                    <Box>
                      <InfoOutlineIcon color="#5C6F81" />
                    </Box>
                    <Box>
                      <Text fontFamily="'Prompt', sans-serif" color="#1A4587">
                        Estimated payoff for inflenser
                      </Text>
                      <Text fontFamily="'Roboto', sans-serif" color={'black'} fontWeight={600}>
                        10 $
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                <Box paddingTop={2} paddingLeft={6}>
                  <Flex gap="2">
                    <Box>
                      <InfoOutlineIcon color="#5C6F81" />
                    </Box>
                    <Box>
                      <Text fontFamily="'Prompt', sans-serif" color="#1A4587">
                        Remaining Budget
                      </Text>
                      <Text fontFamily="'Roboto', sans-serif" color={'black'} fontWeight={600}>
                        {remainingBudget / 1e6} $
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                <Box paddingTop={2} paddingLeft={6}>
                  <Flex gap="2">
                    <Box>
                      <InfoOutlineIcon color="#5C6F81" />
                    </Box>
                    <Box>
                      <Text fontFamily="'Prompt', sans-serif" color="#1A4587">
                        Expiring
                      </Text>
                      <Text fontFamily="'Roboto', sans-serif" color={'black'} fontWeight={600}>
                        {duration}
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                <Box paddingTop={2} paddingLeft={6}>
                  <Flex gap="2">
                    <Box>
                      <InfoOutlineIcon color="#5C6F81" />
                    </Box>
                    <Box>
                      <Text fontFamily="'Prompt', sans-serif" color="#1A4587">
                        # of posts by inflensers
                      </Text>
                      <Text fontFamily="'Roboto', sans-serif" color={'black'} fontWeight={600}>
                        {numberOfPosts}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </Box>
              <Box marginTop={4} mb={{ base: 4, md: 0 }}>
                <Flex gap={4} fontWeight={500}>
                  <Box marginLeft={{ base: 0, md: 5 }} flexBasis="100%">
                    <Button
                      justifyContent="space-between"
                      p={5}
                      fontFamily="'Prompt', sans-serif"
                      color="#1A4587"
                      w="100%"
                      align="left"
                      rightIcon={
                        !settingState ? <TriangleDownIcon color="#FF6827" /> : <TriangleUpIcon color="#FF6827" />
                      }
                      _focus={{
                        boxShadow: '0 0 0 0 rgba(88, 144, 255, .75), 0 0 0 rgba(0, 0, 0, .15)',
                      }}
                      _hover={{ bg: '#F0F3FA' }}
                      _active={{
                        bg: '#F0F3FA',
                        transform: 'scale(1)',
                        borderColor: '#F0F3FA',
                      }}
                      borderBottomRadius={settingState ? '0' : '8px'}
                      bg="#F0F3FA"
                      onClick={() => useSettingState(!settingState)}
                    >
                      Stats
                    </Button>
                    <Box
                      color="#1A4587"
                      bg="#F0F3FA"
                      px={5}
                      pb={2}
                      lineHeight="20px"
                      display={settingState ? 'block' : 'none'}
                      fontSize={17}
                    >
                      <Flex gap="2" mb={3}>
                        <Box>
                          <InfoOutlineIcon color="#5C6F81" />
                        </Box>
                        <Box>
                          <Text fontFamily="'Prompt', sans-serif" color="#1A4587">
                            Clicks
                          </Text>
                          <Text fontFamily="'Roboto', sans-serif" color={'black'} fontWeight={600}>
                            {numberOfClicks}
                          </Text>
                        </Box>
                      </Flex>
                      <Flex gap="2" mb={3}>
                        <Box>
                          <InfoOutlineIcon color="#5C6F81" />
                        </Box>
                        <Box>
                          <Text fontFamily="'Prompt', sans-serif" color="#1A4587">
                            Actions
                          </Text>
                          <Text fontFamily="'Roboto', sans-serif" color={'black'} fontWeight={600}>
                            {numberOfEvents}
                          </Text>
                        </Box>
                      </Flex>
                      <Flex gap="2" mb={3}>
                        <Box>
                          <InfoOutlineIcon color="#5C6F81" />
                        </Box>
                        <Box>
                          <Text fontFamily="'Prompt', sans-serif" color="#1A4587">
                            Re-Posts
                          </Text>
                          <Text fontFamily="'Roboto', sans-serif" color={'black'} fontWeight={600}>
                            {numberOfPosts}
                          </Text>
                        </Box>
                      </Flex>
                    </Box>
                  </Box>
                  <Box flexBasis="100%">
                    <Button
                      justifyContent="space-between"
                      p={5}
                      fontFamily="'Prompt', sans-serif"
                      color="#1A4587"
                      w="100%"
                      rightIcon={
                        !statsState ? <TriangleDownIcon color="#FF6827" /> : <TriangleUpIcon color="#FF6827" />
                      }
                      _focus={{
                        boxShadow: '0 0 0 0 rgba(88, 144, 255, .75), 0 0 0 rgba(0, 0, 0, .15)',
                      }}
                      _active={{
                        bg: '#F0F3FA',
                        transform: 'scale(1)',
                        borderColor: '#F0F3FA',
                      }}
                      _hover={{ bg: '#F0F3FA' }}
                      borderBottomRadius={statsState ? '0' : '8px'}
                      bg="#F0F3FA"
                      onClick={() => setStatsState(!statsState)}
                    >
                      Metrics
                    </Button>
                    <Box
                      color="#1A4587"
                      bg="#F0F3FA"
                      px={5}
                      pb={2}
                      lineHeight="20px"
                      display={statsState ? 'block' : 'none'}
                      fontSize={17}
                    >
                      <Flex gap="2" mb={3}>
                        <Box>
                          <InfoOutlineIcon color="#5C6F81" />
                        </Box>
                        <Box>
                          <Text fontFamily="'Prompt', sans-serif" color="#1A4587">
                            CpC
                          </Text>
                          <Text fontFamily="'Roboto', sans-serif" color={'black'} fontWeight={600}>
                            {clickPayout / 1e6} $
                          </Text>
                        </Box>
                      </Flex>
                      <Flex gap="2" mb={3}>
                        <Box>
                          <InfoOutlineIcon color="#5C6F81" />
                        </Box>
                        <Box>
                          <Text fontFamily="'Prompt', sans-serif" color="#1A4587">
                            CpA
                          </Text>
                          <Text fontFamily="'Roboto', sans-serif" color={'black'} fontWeight={600}>
                            {actionPayout / 1e6} $
                          </Text>
                        </Box>
                      </Flex>
                      <Flex gap="2" mb={3}>
                        <Box>
                          <InfoOutlineIcon color="#5C6F81" />
                        </Box>
                        <Box>
                          <Text fontFamily="'Prompt', sans-serif" color="#1A4587">
                            CpP
                          </Text>
                          <Text fontFamily="'Roboto', sans-serif" color={'black'} fontWeight={600}>
                            {postPayout / 1e6} $
                          </Text>
                        </Box>
                      </Flex>
                    </Box>
                  </Box>
                </Flex>
              </Box>
              <Box
                mt="auto"
                height="fit-content"
                position={{ base: 'static', md: 'absolute' }}
                bottom="0"
                left="20px"
                w="100%"
              >
                <Flex marginRight={{ base: 0, md: '15px' }} display={{ base: 'block', md: 'flex' }}>
                  <Box
                    bg="#F0F3FA"
                    color=" #5C6F81"
                    fontSize="15px"
                    fontStyle="italic"
                    display="flex"
                    padding="16px"
                    borderRadius="8px"
                    w={{ base: '100%', md: '60%' }}
                    mr="9px"
                    mb={{ base: 4, md: 0 }}
                  >
                    Sponsored content with&nbsp;
                    <Text color="#1988F7" textDecorationLine="underline">
                      Booster
                    </Text>
                  </Box>

                  <Button
                    bg="#FF6827"
                    color="white"
                    fontSize="16px"
                    padding="15px 14px"
                    w={{ base: '100%', md: '38%' }}
                    h="auto"
                    onClick={() => handleCreatePost()}
                  >
                    POST
                  </Button>
                </Flex>
              </Box>
            </Box>
          </Flex>
        </>
      )}
    </>
  );
}
