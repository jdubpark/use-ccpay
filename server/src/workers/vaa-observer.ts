/**
 * Take pending VAA requests on database/redis and observe the Wormhole REST API
 * until the VAA is found. For each VAA found, update the database/redis to remove that
 * request for VAA observation, and emit an event picked up by vaa-relayer.ts that
 * relays the confirmed VAA to the destination chain (Polygon) contract.
 */

async function main() {}

main()
