import { useState } from 'react'
import { useGeneralStore } from '../stores/generalStore'
import { Button, Group,  Modal, MultiSelect,  Stepper,  TextInput } from '@mantine/core'
import { useMutation, useQuery } from '@apollo/client'
import {  AddUsersToChatroomMutation, Chatroom, CreateChatroomMutation, SearchUsersQuery } from '../gql/graphql'
import { CREATE_CHATROOM } from '../graphql/mutations/createChatroom'
import { useForm } from '@mantine/form'
import { SEARCH_USER } from '../graphql/queries/SearchUser.s'
import { ADD_USERS_TO_CHATROOM } from '../graphql/mutations/AddUsersToChatroom'
import { IconPlus } from '@tabler/icons-react'


function AddChatroom() {
    const [active, setActive] = useState(1)
    const [highestStepVisited, setHighestStepVisited] = useState(active)
    const isCreateRoomModalOpen = useGeneralStore((state) => state.isCreateRoomModalOpen)
    const toggleCreateRoomModal = useGeneralStore((state) => state.toggleCreateRoomModal)
    const handleStepChange = (nextStep: number) => {
        const isOutOfBounds = nextStep > 2 || nextStep < 0
        if (isOutOfBounds) {
            return
        }
        setActive(nextStep)
        setHighestStepVisited((hSC) => Math.max(hSC, nextStep))
    }
    const [createChatroom, { loading }] = useMutation<CreateChatroomMutation>(CREATE_CHATROOM)
    const form = useForm({
        initialValues: {
            name: '',
        },
        validate: {
            name: (value: string) => value.trim().length >= 3 ? null : "Name must be at least 3 characters!"
        }
    })
    const [newlyCreatedChatroom, setNewlyCreatedChatroom] = useState<Chatroom | null>(null)
    const handleCreateChatroom = async () => {
        await createChatroom({
            variables: {
                name: form.values.name
            },
            onCompleted: (data) => {
                console.log(data)
                setNewlyCreatedChatroom(data.createChatroom)
                handleStepChange(active + 1)
            },
            onError: (err) => {
                console.log(err)
                form.setErrors({
                    name: err.graphQLErrors[0].extensions?.name as string,
                })
            },
            refetchQueries: ['getChatroomsForUser']
        })
    }
    const [searchTerm, setSearchTerm] = useState('')
    const { data, refetch } = useQuery<SearchUsersQuery>(SEARCH_USER, {
        variables: { fullname: searchTerm }
    })
    const [addUsersToChatroom, { loading: loadingAddUsers }] = useMutation<AddUsersToChatroomMutation>(ADD_USERS_TO_CHATROOM, {
        refetchQueries: ['getChatroomsForUser'],
    })
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const handleAddUsersToChatroom = async () => {
        await addUsersToChatroom({
            variables: {
                chatroomId: newlyCreatedChatroom?.id && parseInt(newlyCreatedChatroom?.id),
                userIds: selectedUsers.map((userId) => parseInt(userId))
            },
            onCompleted: () => {
                handleStepChange(1)
                toggleCreateRoomModal()
                setSelectedUsers([])
                setNewlyCreatedChatroom(null)
                form.reset()
            },
            onError: (err) => {
                form.setErrors({
                    name: err.graphQLErrors[0].extensions?.name as string,
                })
            }
        })
    }
    let debounceTimeout: NodeJS.Timeout
    const handleSearchChange = (term: string) => {
        setSearchTerm(term)
        clearTimeout(debounceTimeout)
        debounceTimeout = setTimeout(() => {
            refetch()
        }, 300)
    }
    type SelectItem = {
        label: string
        value: string
    }
    const selectItems: SelectItem[] = data?.searchUsers?.map((user) => ({
        label: user.fullname,
        value: String(user.id)
    })) || []

    return (
        <Modal opened={isCreateRoomModalOpen} onClose={toggleCreateRoomModal}>
            <Stepper
                active={active}
                onStepClick={setActive}
                breakpoint={'sm'}
            >
                <Stepper.Step label='First step' description='Create Chatroom'>
                    <div>Create a Chatroom</div>
                </Stepper.Step>
                <Stepper.Step label='Second step' description='Add members'>
                    <form onSubmit={form.onSubmit(() => handleCreateChatroom())}>
                        <TextInput
                            placeholder='Chatroom name'
                            label='Chatroom name'
                            error={form.errors.name}
                            {...form.getInputProps('name')}
                        />
                        <Button mt={'md'} type='submit'>Create room</Button>
                    </form>
                </Stepper.Step>
                <Stepper.Completed>
                    <MultiSelect
                        onSearchChange={(value)=>{handleSearchChange(value)}}
                        nothingFound='No users found'
                        searchable
                        pb={'xl'}
                        data={selectItems}
                        label='Choose the members you want to add'
                        placeholder='Pick all the users'
                        onChange={(values) => setSelectedUsers(values)}
                    />
                </Stepper.Completed>
            </Stepper>
            <Group mt={'xl'}>
                <Button variant='default' onClick={() => handleStepChange(active - 1)}>Back</Button>
                {
                    selectedUsers.length > 0 && (
                        <Button
                            onClick={handleAddUsersToChatroom}
                            color='blue'
                            leftIcon={<IconPlus />}
                            loading={loading}
                        >
                            Add Users
                        </Button>
                    )
                }
            </Group>

        </Modal>
    )
}

export default AddChatroom