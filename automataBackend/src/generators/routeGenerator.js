/**
 * Gerador de Rotas
 * Cria os arquivos de rotas públicas e privadas
 */

export class RouteGenerator {
  constructor(models) {
    this.models = models;
  }

  /**
   * Gera abreviação de 3 letras para o model
   */
  getAbbreviation(name) {
    const cleaned = name.replace(/_/g, '');
    if (cleaned.length <= 3) return cleaned.toLowerCase();
    
    const letters = cleaned.split('');
    let abbr = letters[0].toLowerCase();
    
    for (let i = 1; i < letters.length && abbr.length < 3; i++) {
      const char = letters[i].toLowerCase();
      if (!'aeiou'.includes(char)) {
        abbr += char;
      }
    }
    
    while (abbr.length < 3 && letters.length > abbr.length) {
      abbr += letters[abbr.length].toLowerCase();
    }
    
    return abbr.substring(0, 3);
  }

  /**
   * Gera arquivo de rotas públicas
   */
  generatePublicRoutes() {
    const imports = this.models.map(model => {
      const abbr = this.getAbbreviation(model.name);
      const abbrCap = abbr.charAt(0).toUpperCase() + abbr.slice(1);
      const modelLower = model.name.toLowerCase();
      
      return `// ${model.name}
import { fnd${abbrCap}Cnt } from "../../controllers/${modelLower}/fnd${abbrCap}Cnt.js";
import { lst${abbrCap}Cnt } from "../../controllers/${modelLower}/lst${abbrCap}Cnt.js";`;
    }).join('\n');

    const routes = this.models.map(model => {
      const abbr = this.getAbbreviation(model.name);
      const abbrCap = abbr.charAt(0).toUpperCase() + abbr.slice(1);
      
      return `// ===== ${model.name} =====
router.get("/fnd${abbrCap}", fnd${abbrCap}Cnt);
router.get("/lst${abbrCap}", lst${abbrCap}Cnt);`;
    }).join('\n\n');

    return `import express from "express";

${imports}

const router = express.Router();

${routes}

export default router;
`;
  }

  /**
   * Gera arquivo de rotas privadas
   */
  generatePrivateRoutes(userType = 'user') {
    const imports = this.models.map(model => {
      const abbr = this.getAbbreviation(model.name);
      const abbrCap = abbr.charAt(0).toUpperCase() + abbr.slice(1);
      const modelLower = model.name.toLowerCase();
      
      return `// ${model.name}
import { reg${abbrCap}Cnt } from "../../controllers/${modelLower}/reg${abbrCap}Cnt.js";
import { fnd${abbrCap}Cnt } from "../../controllers/${modelLower}/fnd${abbrCap}Cnt.js";
import { lst${abbrCap}Cnt } from "../../controllers/${modelLower}/lst${abbrCap}Cnt.js";
import { upd${abbrCap}Cnt } from "../../controllers/${modelLower}/upd${abbrCap}Cnt.js";
import { del${abbrCap}Cnt } from "../../controllers/${modelLower}/del${abbrCap}Cnt.js";`;
    }).join('\n\n');

    const routes = this.models.map(model => {
      const abbr = this.getAbbreviation(model.name);
      const abbrCap = abbr.charAt(0).toUpperCase() + abbr.slice(1);
      
      return `// ===== ${model.name} =====
router.post("/reg${abbrCap}", reg${abbrCap}Cnt);
router.get("/fnd${abbrCap}", fnd${abbrCap}Cnt);
router.get("/lst${abbrCap}", lst${abbrCap}Cnt);
router.put("/upd${abbrCap}", upd${abbrCap}Cnt);
router.delete("/del${abbrCap}", del${abbrCap}Cnt);`;
    }).join('\n\n');

    return `import express from "express";
// import ${userType}Mdl from "../../middlewares/${userType}/${userType}Mdl.js";

${imports}

const router = express.Router();

// Aplica o middleware de validação em todas as rotas
// router.use(${userType}Mdl);

${routes}

export default router;
`;
  }

  /**
   * Gera o arquivo principal de rotas privadas
   */
  generatePrivateIndex() {
    return `import express from "express";
import userPrvRte from "./userPrvRte.js";

const router = express.Router();

// Rotas privadas de usuário
router.use("/user", userPrvRte);

export default router;
`;
  }

  /**
   * Gera o arquivo principal de rotas públicas
   */
  generatePublicIndex() {
    return `import express from "express";
import publicRoutes from "./publicRts.js";

const router = express.Router();

// Rotas públicas
router.use("/", publicRoutes);

export default router;
`;
  }
}
