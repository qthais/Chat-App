import React, { useState } from 'react'
import { useGeneralStore } from '../stores/generalStore'
import { useMediaQuery } from '@mantine/hooks';
import { useUserStore } from '../stores/userStore'
import { useMutation, useQuery } from '@apollo/client'
import { GET_CHATROOMS_FOR_USER } from '../graphql/queries/getChatroomsForUser'
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Flex, Group, Loader, ScrollArea, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import OverlappingAvatar from './OverlappingAvatar';
import { GetChatroomsForUserQuery, LeaveGroupMutation } from '../gql/graphql';
import { LEAVE_GROUP } from '../graphql/mutations/LeaveGroup';
import {
  IconLogout,
} from "@tabler/icons-react"
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
function RoomList() {
  const toggleCreateRoomModal = useGeneralStore((state) => state.toggleCreateRoomModal)
  const userId = useUserStore((state) => state.id)
  const navigate = useNavigate()
  const [activeRoomId, setActiveRoomId] = useState<number | null>(parseInt(useParams<{ id: string }>().id || "0"))
  const isSmallDevice = useMediaQuery("(max-width:768px")
  const defaultTextStyle: React.CSSProperties = {
    textOverflow: isSmallDevice ? 'unset' : 'ellipsis',
    whiteSpace: isSmallDevice ? 'unset' : 'nowrap',
    overflow: isSmallDevice ? 'unset' : 'hidden'
  }
  const defaultFlexStyle: React.CSSProperties = {
    maxWidth: isSmallDevice ? 'unset' : '200px'
  }
  const { data, loading, error } = useQuery<GetChatroomsForUserQuery>(
    GET_CHATROOMS_FOR_USER,
    {
      variables: {
        userId: userId
      }
    })
  const [leaveGroup] = useMutation<LeaveGroupMutation>(LEAVE_GROUP, {
    variables: {
      chatroomId: activeRoomId
    },
    refetchQueries: [
      {
        query: GET_CHATROOMS_FOR_USER,
        variables: {
          userId: userId
        }
      }
    ],
    onCompleted: (data) => {
      navigate('/')
    }
  })
  return (
    <Flex
      direction={"row"}
      w={isSmallDevice ? "calc(100%-100px)" : "550px"}
      h={"100vh"}
      ml={"100px"}
    >
      <Card radius={'lg'} w={"100%"} p={0}>
        <Flex direction={'column'} align={'start'} w={'100%'}>
          <Group position='apart' w={'100%'} style={{ width: "100%" }} mb={'md'} mt={'md'}>
            <Button onClick={toggleCreateRoomModal} variant='light' leftIcon={<IconPlus />}>
              Create a room
            </Button>
          </Group>
          <ScrollArea h={'83vh'} w={'100%'}>
            <Flex direction={'column'}>
              <Flex justify={'center'} align={'center'} h={'100%'} mih={'75px'}>
                {
                  loading && (
                    <Flex align={'center'}>
                      <Loader mr={'md'} />
                      <Text c={'dimmed'} italic>
                        Loading...
                      </Text>
                    </Flex>

                  )
                }
              </Flex>
              {
                data?.getChatroomsForUser.map((chatroom) => (
                  <Link className='mx-3'
                    style={
                      {
                        transition: 'background-color 0.3s',
                        cursor: 'pointer'
                      }
                    }
                    to={`/chatrooms/${chatroom.id}`}
                    key={chatroom.id}
                    onMouseEnter={() => setActiveRoomId(parseInt(chatroom.id || '0'))}
                  >
                    <Card
                      sx={(theme) => ({
                        width: '100%',
                        '&:hover': {
                          backgroundColor: theme.colors.gray[2], // Use Mantine's theme color
                        },
                      })}
                      mih={120}
                      py={'md'}

                      radius={'lg'}
                    >
                      <Flex justify={'space-between'}>
                        {chatroom.users && (
                          <Flex align={'center'}>
                            <OverlappingAvatar users={chatroom.users} />
                          </Flex>
                        )}
                        {chatroom.messages && chatroom.messages.length > 0 ? (
                          <Flex
                            style={defaultFlexStyle}
                            direction={'column'}
                            align={'start'}
                            ml={'15%'}
                            w={'100%'}
                            h={'100%'}
                          >
                            <Flex
                              direction={'column'}

                            >
                              <Text className='text-xl font-bold' style={defaultTextStyle}>{chatroom.name}</Text>
                              <Text italic c={'dimmed'} style={defaultTextStyle}>{chatroom.messages[0].user?.fullname}:  {chatroom.messages[0].content}</Text>
                              <Text c={"dimmed"} style={defaultTextStyle}>
                                {dayjs(chatroom.messages[0].createdAt).fromNow()}
                              </Text>
                            </Flex>
                          </Flex>
                        ) : (
                          <Flex
                            style={defaultFlexStyle}
                            direction={'column'}
                            align={'start'}
                            ml={'15%'}
                            w={'100%'}
                            h={'100%'}
                          >
                            <Text className='text-xl font-bold' style={defaultTextStyle}>{chatroom.name}</Text>
                            <Text italic c={'dimmed'}>
                              No Messages
                            </Text>
                          </Flex>
                        )
                        }
                        <Flex h={'100%'} align={'end'} justify={'end'}>
                          <Button
                            p={0}
                            variant='light'
                            color='red'
                            onClick={(e) => {
                              e.preventDefault()
                              leaveGroup()
                            }}
                          >
                            <IconLogout />
                          </Button>
                        </Flex>
                      </Flex>
                    </Card>
                  </Link>
                ))
              }
            </Flex>
          </ScrollArea>
        </Flex>
      </Card>
    </Flex>
  )
}

export default RoomList