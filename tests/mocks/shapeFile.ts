import { readFileSync } from 'fs';
import { resolve } from 'path';

const filesJsonPath = resolve(__dirname, '../mockData/files.json');
const productJsonPath = resolve(__dirname, '../mockData/product.json');
const metaJsonPath = resolve(__dirname, '../mockData/shapeMetadata.json');

const filesStr = readFileSync(filesJsonPath, { encoding: 'utf8' });
const productStr = readFileSync(productJsonPath, { encoding: 'utf8' });
const metadataStr = readFileSync(metaJsonPath, { encoding: 'utf8' });

const files = JSON.parse(filesStr) as unknown;
const product = JSON.parse(productStr) as unknown;
const metadata = JSON.parse(metadataStr) as unknown;

const readMock = jest.fn();
const initShapeFileMock = (): void => {
  readMock.mockImplementation((shpFilePath: string) => {
    if (shpFilePath.toLocaleLowerCase().includes('files')) {
      return files;
    } else if (shpFilePath.toLocaleLowerCase().includes('product')) {
      return product;
    } else if (shpFilePath.toLocaleLowerCase().includes('metadata')) {
      return metadata;
    }
  });
};
export { readMock, initShapeFileMock };
