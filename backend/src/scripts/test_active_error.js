require("dotenv").config({ path: "/Users/amanjha/Desktop/Dev/DevArc/platform/backend/.env" });
const moduleResourceService = require("../services/moduleResourceService");

async function main() {
    console.log("Testing generation for second module...");
    try {
        const res = await moduleResourceService.generateModuleResources(
            "6ca8ceda-f4c7-4659-85bc-f904d3443bf7",
            "Frontend Architecture Masterclass",
            "State machines and client state hooks"
        );
        console.log("Success:", JSON.stringify(res, null, 2));
    } catch (err) {
        console.error("DIAGNOSTIC ERROR FAILED:", err.stack || err);
    }
}

main();
