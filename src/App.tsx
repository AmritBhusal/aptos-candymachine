import { Layout, Row, Col, Button, Spin, List, Checkbox, Input } from "antd";
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { HexString, AptosAccount, FaucetClient,BCS} from "aptos";
// import { u64 } from "@saberhq/token-utils";
// import invariant from 'tiny-invariant';
// import keccak256 from "keccak256";
// import MerkleTree from "merkletreejs";

const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);
const alice = new AptosAccount(HexString.ensure("0x1111111111111111111111111111111111111111111111111111111111111111").toUint8Array());
// const bob = new AptosAccount(HexString.ensure("0x2111111111111111111111111111111111111111111111111111111111111111").toUint8Array());

// const notwhitelist = new AptosAccount()

// const to_buf = (account:Uint8Array,amount:number): Buffer=>{ 
//   return Buffer.concat([
//     account,
//     new u64(amount).toArrayLike(Buffer, "le", 8),
//   ]);
// }

console.log("Alice Address: "+alice.address())
// console.log("Bob Address: "+bob.address())

const moduleAddress = "0x8035a63a18798115679466eef240aca66364707044f0ac7484e4c462c8310ae9";

type Task = {
  address: string;
  completed: boolean;
  content: string;
  task_id: string;
};

// function makeid(length: number) {
//   var result           = '';
//   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxy';
//   var charactersLength = characters.length;
//   for ( var i = 0; i < length; i++ ) {
//       result += characters.charAt(Math.floor(Math.random() * charactersLength));
//   }
//   return result;
// }

function App() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [accountHasList, setAccountHasList] = useState<boolean>(false);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [newTask, setNewTask] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);

  const onWriteTask = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNewTask(value);
  };

  useEffect(() => {
    fetchList();
  }, [account?.address]);


  const fetchList = async () => {
    if (!account) return [];
    try {
      const CandyMachineResource = await client.getAccountResource(
        account.address,
        moduleAddress+":candymachine::CandyMachine"
        
      );
      setAccountHasList(true);
      const tableHandle = (CandyMachineResource as any).data.tasks.handle;
      const taskCounter = (CandyMachineResource as any).data.task_counter;

      let tasks = [];
      let counter = 1;
      while (counter <= taskCounter) {
        const tableItem = {
          key_type: "u64",
          value_type: moduleAddress+"::candymachine::Task",
          key: `${counter}`,
        };
        const task = await client.getTableItem(tableHandle, tableItem);
        tasks.push(task);
        counter++;
      }
          // set tasks in local state
      setTasks(tasks);
    } catch (e: any) {
      setAccountHasList(false);
    }
    console.log("Hello");

  };
  
 
  const addNew = async () => {
    if (!account) return [];
    setTransactionInProgress(true);
    const payload = {
      type: "entry_function_payload",
      function: moduleAddress+"::candymachine::init_candy",
      type_arguments: [],
      arguments: [
        "Mokshya",
        "My NFT Collection",
        "https://mokshya.io/nft/",
        alice.address(),
        "1000",
        "42",
        1644782400, 
        1644969600,
        "1000",
        "2000",
        "100",
        [true, false, false],
        [true,true, true, true, true ],
        100,
        "merkle_root_in_hex",
        "seeds_in_hex",
      ],
    };
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(payload);
      // wait for transaction
      await client.waitForTransaction(response.hash);
      setAccountHasList(true);
    } catch (error: any) {
      setAccountHasList(false);
    } finally {
      setTransactionInProgress(false);
    }
  };
  
  // let txnRequest = await client.generateTransaction(alice.address(), create_candy_machine);
  //       let bcsTxn = AptosClient.generateBCSTransaction(alice, txnRequest);
  //       let transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
  //       console.log("Candy Machine created: "+transactionRes.hash)

  //   const onTaskAdded = async () => {
  //   // check for connected account
  //   if (!account) return;
  //   setTransactionInProgress(true);
  //   // build a transaction payload to be submited
  //   const payload = {
  //     type: "entry_function_payload",
  //     function: moduleAddress+"::candymachine::init_candy",
  //     type_arguments: [],
  //     arguments: [newTask],
  //   };

  //   try {
  //     // sign and submit transaction to chain
  //     const response = await signAndSubmitTransaction(payload);
  //     // wait for transaction
  //     await client.waitForTransaction(response.hash);

  //           // hold the latest task.task_id from our local state
  //     const latestId = tasks.length > 0 ? parseInt(tasks[tasks.length - 1].task_id) + 1 : 1;

  //     // build a newTaskToPush objct into our local state
  //     const newTaskToPush = {
  //       address: account.address,
  //       completed: false,
  //       content: newTask,
  //       task_id: latestId + "",
  //     };

  //     // Create a new array based on current state:
  //     let newTasks = [...tasks];

  //     // Add item to it
  //     newTasks.unshift(newTaskToPush);

  //     // Set state
  //     setTasks(newTasks);
  //           // clear input text
  //     setNewTask("");
  //   } catch (error: any) {
  //     console.log("error", error);
  //   } finally {
  //     setTransactionInProgress(false);
  //   }
  // };

  // const onCheckboxChange = async (
  //   event: CheckboxChangeEvent,
  //   taskId: string
  // ) => {
  //   if (!account) return;
  //   if (!event.target.checked) return;
  //   setTransactionInProgress(true);
  //   const payload = {
  //     type: "entry_function_payload",
  //     function: moduleAddress+"::candymachine::init_candy",
  //     type_arguments: [],
  //     arguments: [taskId],
  //   };

  //   try {
  //     // sign and submit transaction to chain
  //     const response = await signAndSubmitTransaction(payload);
  //     // wait for transaction
  //     await client.waitForTransaction(response.hash);

  //     setTasks((prevState) => {
  //       const newState = prevState.map((obj) => {
  //         // if task_id equals the checked taskId, update completed property
  //         if (obj.task_id === taskId) {
  //           return { ...obj, completed: true };
  //         }

  //         // otherwise return object as is
  //         return obj;
  //       });

  //       return newState;
  //     });
  //   } catch (error: any) {
  //     console.log("error", error);
  //   } finally {
  //     setTransactionInProgress(false);
  //   }
  // };


  return (
    <>
    <Layout>
      <Row align="middle">
        <Col span={10} offset={2}>
          <h1>Candymachine</h1>
        </Col>
        <Col span={12} style={{ textAlign: "right", paddingRight: "200px" }}>
          <WalletSelector />
        </Col>
      </Row>
    </Layout>
    <Spin spinning={transactionInProgress}>
        {!accountHasList ? (
          <Row gutter={[0, 32]} style={{ marginTop: "2rem" }}>
            <Col span={8} offset={8}>
              <Button
                disabled={!account}
                block
                onClick={addNew}
                type="primary"
                style={{ height: "40px", backgroundColor: "#3f67ff" }}
              >
                Add new
              </Button>
            </Col>
          </Row>
        ) : (
          <Row gutter={[0, 32]} style={{ marginTop: "2rem" }}>
            <Col span={8} offset={8}>
              <Input.Group compact>
                <Input
                  onChange={(event) => onWriteTask(event)}
                  style={{ width: "calc(100% - 60px)" }}
                  placeholder="Add a Task"
                  size="large"
                  value={newTask}
                />
                {/* <Button onClick={onTaskAdded} type="primary" style={{ height: "40px", backgroundColor: "#3f67ff" }}>
                  Add
                </Button> */}
              </Input.Group>
            </Col>
            <Col span={8} offset={8}>
              {tasks && (
                <List
                  size="small"
                  bordered
                  dataSource={tasks}
                  renderItem={(task: Task) => (
                    <List.Item
                      // actions={[
                      //   <div>
                      //     {task.completed ? (
                      //       <Checkbox defaultChecked={true} disabled />
                      //     ) : (
                      //       <Checkbox onChange={(event) => onCheckboxChange(event, task.task_id)} />
                      //     )}
                      //   </div>,
                      // ]}
                    >
                      <List.Item.Meta
                        title={task.task_id}
                        description={
                          <a
                            href={`https://explorer.aptoslabs.com/account/${task.address}/`}
                            target="_blank"
                          >{`${task.address.slice(0, 6)}...${task.address.slice(-5)}`}</a>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Col>
          </Row>
        )}
      </Spin>
  </>
  );
}

export default App;
