export = EcovacsMQTT_XML;
declare class EcovacsMQTT_XML extends EcovacsMQTT {
    vacBot: any;
    /**
     * It takes an XML string and converts it into JSON object
     * @param {string} xmlString - the XML string
     * @returns {Object} a JSON object
     */
    command_xml2json(xmlString: string, ...args: any[]): any;
}
import EcovacsMQTT = require("../ecovacsMQTT");
//# sourceMappingURL=ecovacsMQTT_XML.d.ts.map