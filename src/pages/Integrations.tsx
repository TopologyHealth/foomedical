import { ClientFactory, SmartLaunchHandler } from "@TopologyHealth/smarterfhir";
import { LAUNCH } from "@TopologyHealth/smarterfhir/lib/Client/ClientFactory";
import { useContext, useEffect, useRef } from "react";
import { SmarterFhirContext } from "../App";
import { Group, Stack, Title, Divider, Text, Button } from "@mantine/core";
import { Document } from "@medplum/react";
import { EMR } from "@TopologyHealth/smarterfhir/lib/Launcher/SmartLaunchHandler";

export const EpicTag = () => {
  return <Text style={{
    backgroundColor: "#db5a33", color: "white", borderRadius: "0.25rem",
    paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.25rem", paddingBottom: "0.25rem", 
    fontWeight: "bold", maxWidth: "fit-content" 
  }}>
    Epic
  </Text>
}

async function startStandaloneLaunch() {
  console.log("Launched");
  try {
    const emrClientID = "86e74d43-2046-492e-b460-73c31fa7289d"
    const smartLaunchHandler = new SmartLaunchHandler(emrClientID)
    smartLaunchHandler.authorizeStandalone(EMR.EPIC)
  }
  catch (e) {
    if (e instanceof Error) {
      throw e;
    }
  }
}

export const Integrations = () => {
  const authCheckedRef = useRef(false);
  const { client, setClient } = useContext(SmarterFhirContext);

  useEffect(() => {
    if (authCheckedRef.current) return;
    authCheckedRef.current = true;
    console.log("Running mount effect");
    let cancelled = false;

    try {
      const clientFactory = new ClientFactory();
      clientFactory.createEMRClient(LAUNCH.STANDALONE).then(client => {
        setClient(client);
        client.getPatientRead().then(v => console.log(`Successfully authenticated with Epic for patient ${v}`));
      })
    }
    catch (e) {
      console.error(e);
    }

    return () => { cancelled = true; }
  }, []);
  
  return <div>
    <Document width={800}>
      <Title>Integrations</Title>
      <Divider my="xl" />
      <Stack spacing="xl">
        <Group align="top">
          <Text size="sm" weight={500} m="sm">
            Epic
          </Text>
          <Button compact my="sm" onClick={() => client !== null ? setClient(null) : startStandaloneLaunch()}>
            {client !== null ? "Disconnect" : "Connect"}
          </Button>
        </Group>
      </Stack>
    </Document>
  </div>
}