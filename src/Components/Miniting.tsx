import { Layout, Row, Col, Button, Input } from "antd";
// import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Network, Provider } from "aptos";
// import { HexString, AptosAccount, FaucetClient,BCS} from "aptos";
// import { u64 } from "@saberhq/token-utils";


const client = new AptosClient('https://fullnode.testnet.aptoslabs.com/v1');

// const alice = new AptosAccount(HexString.ensure("0x1111111111111111111111111111111111111111111111111111111111111111").toUint8Array());
// const bob = new AptosAccount(HexString.ensure("0x2111111111111111111111111111111111111111111111111111111111111111").toUint8Array());

export const moduleAddress = "0x8035a63a18798115679466eef240aca66364707044f0ac7484e4c462c8310ae9";

export const provider = new Provider(Network.DEVNET);

function Mint() {
  const {account, signAndSubmitTransaction } = useWallet();
  const [accountHasList, setAccountHasList] = useState<boolean>(false);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);

  useEffect(() => {
    fetchList();
  }, [account?.address]);

  const fetchList = async () => {
    if (!account) return [];
    try {
      const CandyMachineResource = await client.getAccountResource(
        account.address,
        moduleAddress+"::candymachine::mint"
        
      );
      setAccountHasList(true);
      const tableHandle = (CandyMachineResource as any).data.tasks.handle;
      // const taskCounter = (CandyMachineResource as any).data.task_counter;
      
    } catch (e: any) {
      setAccountHasList(false);
    }
    console.log("Hello");

  };

  const mintcandy = async () => {
    if (!account) return [];
    setTransactionInProgress(true);
    // build a transaction payload to be submited
    const payload = {
      type: "entry_function_payload",
      function: `${moduleAddress}::candymachine::mint`,
      type_arguments: [],
      arguments: [
        "0x147e4d3a5b10eaed2a93536e284c23096dfcea9ac61f0a8420e5d01fbd8f0ea8",
        100,
      ],
    };
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(payload);
      // wait for transaction
      await provider.waitForTransaction(response.hash);
      setAccountHasList(true);
    } catch (error: any) {
      setAccountHasList(false);
    } finally {
      setTransactionInProgress(false);
    }
  };


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
          <Row gutter={[0, 32]} style={{ marginTop: "2rem" }}>
          <input placeholder="Candymachine Address" />
          <input placeholder="Price" />
            <Col span={8} offset={8}>
              <Button
                disabled={!account}
                block
                onClick={mintcandy}
                type="primary"
                style={{ height: "40px", backgroundColor: "#3f67ff" }}
              >
                Mint Candy
              </Button>
            </Col>
          </Row>
    </>
  );
}

export default Mint;
