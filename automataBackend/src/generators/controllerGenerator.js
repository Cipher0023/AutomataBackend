/**
 * Gerador de Controllers
 * Cria os arquivos de controller baseados nos models do Prisma
 */

export class ControllerGenerator {
  constructor(model) {
    this.model = model;
    this.modelName = model.name;
    this.modelNameLower = this.modelName.toLowerCase();
    this.abbreviation = this.getAbbreviation(this.modelName);
  }

  /**
   * Gera abreviação de 3 letras para o model
   */
  getAbbreviation(name) {
    // Remove underscores e pega as primeiras letras
    const cleaned = name.replace(/_/g, '');
    if (cleaned.length <= 3) return cleaned.toLowerCase();
    
    // Pega primeira letra + primeiras consoantes
    const letters = cleaned.split('');
    let abbr = letters[0].toLowerCase();
    
    for (let i = 1; i < letters.length && abbr.length < 3; i++) {
      const char = letters[i].toLowerCase();
      if (!'aeiou'.includes(char)) {
        abbr += char;
      }
    }
    
    // Se ainda não tem 3 letras, completa com as próximas
    while (abbr.length < 3 && letters.length > abbr.length) {
      abbr += letters[abbr.length].toLowerCase();
    }
    
    return abbr.substring(0, 3);
  }

  /**
   * Gera o controller de registro (CREATE)
   */
  generateRegisterController() {
    const fields = this.model.fields.filter(f => 
      !f.isId && 
      !f.name.includes('_at') && 
      !f.isRelation
    );

    const fieldNames = fields.map(f => f.name).join(',\n      ');
    const serviceParams = fields.map(f => f.name).join(',\n      ');
    const jsdocParams = fields.map(f => 
      ` * @param {${this.getJSDocType(f.type)}} req.body.${f.name} - ${f.name}`
    ).join('\n');

    return `import { reg${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)} } from "../../services/${this.modelNameLower}/all${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}Srv.js";

/**
 * Controller para registrar um novo ${this.modelName}
 * 
 * Recebe dados do corpo da requisição e os envia para o service de registro
 * Valida e cria um novo registro no banco de dados
 * 
 * @param {import('express').Request} req - Objeto de requisição do Express
${jsdocParams}
 * @param {import('express').Response} res - Objeto de resposta do Express
 * 
 * @returns {Object} Novo ${this.modelName} criado com status 201
 * @throws {Error} Erro ao registrar com status 500
 */
export const reg${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}Cnt = async (req, res) => {
  try {
    const {
      ${fieldNames}
    } = req.body;

    // Enviando dados para o service
    const new${this.modelName} = await reg${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}(
      ${serviceParams}
    );

    console.log(new${this.modelName});
    return res.status(201).json(new${this.modelName});
  } catch (err) {
    console.error("Erro ao registrar:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
`;
  }

  /**
   * Gera o controller de busca por ID (READ ONE)
   */
  generateFindController() {
    const idField = this.model.fields.find(f => f.isId);
    const idName = idField ? idField.name : `${this.modelNameLower}_id`;

    return `import { fnd${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)} } from "../../services/${this.modelNameLower}/all${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}Srv.js";

/**
 * Controller para buscar um ${this.modelName} específico
 * 
 * @param {import('express').Request} req - Objeto de requisição do Express
 * @param {string} req.query.${idName} - ID do ${this.modelName}
 * @param {import('express').Response} res - Objeto de resposta do Express
 * 
 * @returns {Object} ${this.modelName} encontrado com status 200
 * @throws {Error} Erro ao buscar com status 500
 */
export const fnd${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}Cnt = async (req, res) => {
  try {
    const { ${idName} } = req.query;

    if (!${idName}) {
      return res.status(400).json({ message: "${idName} é obrigatório" });
    }

    const ${this.modelNameLower} = await fnd${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}(${idName});

    if (!${this.modelNameLower}) {
      return res.status(404).json({ message: "${this.modelName} não encontrado" });
    }

    return res.status(200).json(${this.modelNameLower});
  } catch (err) {
    console.error("Erro ao buscar:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
`;
  }

  /**
   * Gera o controller de listagem (READ ALL)
   */
  generateListController() {
    return `import { lst${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)} } from "../../services/${this.modelNameLower}/all${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}Srv.js";

/**
 * Controller para listar todos os ${this.modelName}s
 * 
 * @param {import('express').Request} req - Objeto de requisição do Express
 * @param {import('express').Response} res - Objeto de resposta do Express
 * 
 * @returns {Array} Lista de ${this.modelName}s com status 200
 * @throws {Error} Erro ao listar com status 500
 */
export const lst${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}Cnt = async (req, res) => {
  try {
    const ${this.modelNameLower}s = await lst${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}();
    return res.status(200).json(${this.modelNameLower}s);
  } catch (err) {
    console.error("Erro ao listar:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
`;
  }

  /**
   * Gera o controller de atualização (UPDATE)
   */
  generateUpdateController() {
    const idField = this.model.fields.find(f => f.isId);
    const idName = idField ? idField.name : `${this.modelNameLower}_id`;

    return `import { upd${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)} } from "../../services/${this.modelNameLower}/all${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}Srv.js";

/**
 * Controller para atualizar um ${this.modelName}
 * 
 * @param {import('express').Request} req - Objeto de requisição do Express
 * @param {string} req.query.${idName} - ID do ${this.modelName}
 * @param {Object} req.body - Dados para atualização
 * @param {import('express').Response} res - Objeto de resposta do Express
 * 
 * @returns {Object} ${this.modelName} atualizado com status 200
 * @throws {Error} Erro ao atualizar com status 500
 */
export const upd${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}Cnt = async (req, res) => {
  try {
    const { ${idName} } = req.query;
    const updateData = req.body;

    if (!${idName}) {
      return res.status(400).json({ message: "${idName} é obrigatório" });
    }

    const result = await upd${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}(${idName}, updateData);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Erro ao atualizar:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
`;
  }

  /**
   * Gera o controller de deleção (DELETE)
   */
  generateDeleteController() {
    const idField = this.model.fields.find(f => f.isId);
    const idName = idField ? idField.name : `${this.modelNameLower}_id`;

    return `import { del${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)} } from "../../services/${this.modelNameLower}/all${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}Srv.js";

/**
 * Controller para deletar um ${this.modelName}
 * 
 * @param {import('express').Request} req - Objeto de requisição do Express
 * @param {string} req.query.${idName} - ID do ${this.modelName}
 * @param {import('express').Response} res - Objeto de resposta do Express
 * 
 * @returns {Object} Confirmação de deleção com status 200
 * @throws {Error} Erro ao deletar com status 500
 */
export const del${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}Cnt = async (req, res) => {
  try {
    const { ${idName} } = req.query;

    if (!${idName}) {
      return res.status(400).json({ message: "${idName} é obrigatório" });
    }

    const result = await del${this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1)}(${idName});
    return res.status(200).json(result);
  } catch (err) {
    console.error("Erro ao deletar:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
`;
  }

  /**
   * Converte tipo Prisma para tipo JSDoc
   */
  getJSDocType(prismaType) {
    const typeMap = {
      'String': 'string',
      'Int': 'number',
      'Float': 'number',
      'Boolean': 'boolean',
      'DateTime': 'string',
      'Json': 'Object'
    };
    return typeMap[prismaType] || 'any';
  }

  /**
   * Gera todos os controllers
   */
  generateAll() {
    return {
      register: this.generateRegisterController(),
      find: this.generateFindController(),
      list: this.generateListController(),
      update: this.generateUpdateController(),
      delete: this.generateDeleteController()
    };
  }
}
