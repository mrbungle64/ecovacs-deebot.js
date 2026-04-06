export = EcovacsMQTT_XML;
declare class EcovacsMQTT_XML extends EcovacsMQTT {
    vacBot: Object;
    /**
     * It creates a string with the payload in xml format
     * and also removes the td element
     * @param {Object} command - the command object
     * @returns {string}
     */
    getCommandPayload(command: Object): string;
    /**
     * It takes an XML string and converts it into JSON object
     * @param {string} xmlString - the XML string
     * @param {Object} [command] - the command object
     * @returns {Object} a JSON object
     */
    commandXml2Json(xmlString: string, command?: Object): Object;
}
import EcovacsMQTT = require("../ecovacsMQTT");
//# sourceMappingURL=ecovacsMQTT_XML.d.ts.map