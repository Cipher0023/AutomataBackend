/**
 * Gerador de Services
 * Cria os arquivos de service com toda a lógica de negócio
 */

export class ServiceGenerator {
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
   * Gera o service completo com todas as operações CRUD
   */
  generateService() {
    const idField = this.model.fields.find(f => f.isId);
    const idName = idField ? idField.name : `${this.modelNameLower}_id`;
    
    const dataFields = this.model.fields.filter(f => 
      !f.isId && 
      !f.name.includes('_at') && 
      !f.isRelation
    );

    const requiredFields = dataFields.filter(f => !f.isOptional && !f.hasDefault);
    
    return `import prisma from "../../prisma/prismaClient.js";

${this.generateRegisterService(dataFields, requiredFields, idName)}

${this.generateFindService(idName)}

${this.generateListService()}

${this.generateUpdateService(dataFields, idName)}

${this.generateDeleteService(idName)}
`;
  }

  /**
   * Gera o service de registro
   */
  generateRegisterService(dataFields, requiredFields, idName) {
    const params = dataFields.map(f => f.name).join(',\n  ');
    const jsdocParams = dataFields.map(f => 
      ` * @param {${this.getPrismaType(f.type)}} ${f.name} - ${f.name}`
    ).join('\n');
    
    const requiredChecks = requiredFields.map(f => `!${f.name}`).join(' ||\n    ');
    
    const dataObject = dataFields.map(f => {
      const conversion = this.getTypeConversion(f);
      return `      ${f.name}: ${conversion}`;
    }).join(',\n');

    const abbr = this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1);

    return `/**
 * Service para registrar um novo ${this.modelName}
 * 
 * Valida todos os campos obrigatórios, converte tipos de dados
 * e cria um novo registro no banco de dados
 * 
${jsdocParams}
 * 
 * @returns {Object} Novo ${this.modelName} criado com todos os campos
 * @throws {Error} Se algum campo obrigatório estiver faltando
 */
export const reg${abbr} = async (
  ${params}
) => {
  // Verificação de campos obrigatórios
  if (
    ${requiredChecks}
  ) {
    throw new Error("Preencha todos os campos obrigatórios");
  }

  ${this.generateBooleanConverter()}

  // Criando novo registro
  const newRegister = await prisma.${this.modelNameLower}.create({
    data: {
${dataObject}
    },
  });

  return newRegister;
};`;
  }

  /**
   * Gera o service de busca
   */
  generateFindService(idName) {
    const abbr = this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1);
    
    return `/**
 * Service para buscar um ${this.modelName} específico pelo ID
 * 
 * @param {string} ${idName} - ID único do ${this.modelName}
 * 
 * @returns {Object|null} ${this.modelName} encontrado ou null se não existir
 * @throws {Error} Se houver erro na busca
 */
export const fnd${abbr} = async (${idName}) => {
  return await prisma.${this.modelNameLower}.findUnique({
    where: { ${idName} },
  });
};`;
  }

  /**
   * Gera o service de listagem
   */
  generateListService() {
    const abbr = this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1);
    
    return `/**
 * Service para listar todos os ${this.modelName}s
 * 
 * @returns {Array} Array com todos os ${this.modelName}s encontrados
 * @throws {Error} Se houver erro na listagem
 */
export const lst${abbr} = async () => {
  try {
    const result = await prisma.${this.modelNameLower}.findMany();
    return result;
  } catch (error) {
    console.error("Erro ao listar ${this.modelName}s:", error.message);
    throw new Error("Erro ao listar ${this.modelName}s.");
  }
};`;
  }

  /**
   * Gera o service de atualização
   */
  generateUpdateService(dataFields, idName) {
    const abbr = this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1);
    const allowedFields = dataFields.map(f => `"${f.name}"`).join(',\n      ');
    
    const switchCases = dataFields.map(f => {
      if (f.type === 'Int') {
        return `        case "${f.name}":
          const intVal = parseInt(value);
          if (isNaN(intVal))
            throw new Error(\`Campo "\${field}" deve ser um número inteiro válido\`);
          updateFields[field] = intVal;
          break;`;
      } else if (f.type === 'Float') {
        return `        case "${f.name}":
          const floatVal = parseFloat(value);
          if (isNaN(floatVal))
            throw new Error(\`Campo "\${field}" deve ser um número decimal válido\`);
          updateFields[field] = floatVal;
          break;`;
      } else if (f.type === 'Boolean') {
        return `        case "${f.name}":
          const bolVal = booleanConverter(value);
          updateFields[field] = bolVal;
          break;`;
      } else if (f.type === 'DateTime') {
        return `        case "${f.name}":
          const dateVal = new Date(value);
          if (isNaN(dateVal.getTime()))
            throw new Error(\`Campo "\${field}" deve ser uma data válida\`);
          updateFields[field] = dateVal;
          break;`;
      }
      return null;
    }).filter(Boolean).join('\n\n');

    return `/**
 * Service para atualizar um ${this.modelName} existente
 * 
 * @param {string} ${idName} - ID único do ${this.modelName} a ser atualizado
 * @param {Object} updateData - Objeto com os campos a atualizar
 * 
 * @returns {Object} Objeto com mensagem de sucesso e dados atualizados
 * @throws {Error} Se nenhum campo válido for fornecido
 */
export const upd${abbr} = async (${idName}, updateData) => {
  try {
    // Campos permitidos para atualização
    const allowedFields = [
      ${allowedFields}
    ];

    const updateFields = {};

    ${this.generateBooleanConverter()}

    // Popula updateFields com a updateData colocando o tipo certo de variável
    for (const field of allowedFields) {
      const value = updateData[field];

      switch (field) {
${switchCases}

        default:
          if (value !== undefined && value !== null && value !== "") {
            updateFields[field] = value;
          }
          break;
      }
    }

    // Verifica se pelo menos um dado vai ser atualizado
    if (Object.keys(updateFields).length === 0) {
      throw new Error("Nenhum dado válido para atualizar");
    }

    // Realiza o update tendo como base no updateFields
    const update = await prisma.${this.modelNameLower}.update({
      where: { ${idName} },
      data: updateFields,
    });

    return {
      message: "Atualizado com sucesso",
      newData: update,
    };
  } catch (err) {
    console.error("Erro ao atualizar ${this.modelName}:", err);
    throw err;
  }
};`;
  }

  /**
   * Gera o service de deleção
   */
  generateDeleteService(idName) {
    const abbr = this.abbreviation.charAt(0).toUpperCase() + this.abbreviation.slice(1);
    
    return `/**
 * Service para deletar um ${this.modelName}
 * 
 * @param {string} ${idName} - ID único do ${this.modelName} a ser deletado
 * 
 * @returns {Object} Objeto com confirmação de sucesso
 * @throws {Error} Se houver erro na deleção
 */
export const del${abbr} = async (${idName}) => {
  try {
    await prisma.${this.modelNameLower}.delete({
      where: { ${idName} },
    });

    return { success: true, message: "${this.modelName} deletado com sucesso." };
  } catch (error) {
    console.error("Erro ao deletar ${this.modelName}:", error.message);
    return { success: false, message: "Erro ao deletar ${this.modelName}" };
  }
};`;
  }

  /**
   * Gera a função de conversão de boolean
   */
  generateBooleanConverter() {
    const hasBoolean = this.model.fields.some(f => f.type === 'Boolean');
    if (!hasBoolean) return '';

    return `    // Conversor de boolean
    function booleanConverter(value) {
      if (value == "true") return true;
      if (value == "false") return false;
      else {
        throw new Error("Campo contém um valor inválido para boolean");
      }
    }`;
  }

  /**
   * Gera a conversão de tipo apropriada para cada campo
   */
  getTypeConversion(field) {
    switch (field.type) {
      case 'Int':
        return `parseInt(${field.name})`;
      case 'Float':
        return `parseFloat(${field.name})`;
      case 'Boolean':
        return `booleanConverter(${field.name})`;
      case 'DateTime':
        return `new Date(${field.name})`;
      default:
        return field.name;
    }
  }

  /**
   * Converte tipo Prisma para tipo JavaScript
   */
  getPrismaType(prismaType) {
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
}
