import { Test, TestingModule } from '@nestjs/testing';

type createTestingModuleParams = {
  providers: any[];
};

export const createTestingModule = async ({
  providers = [],
}: createTestingModuleParams): Promise<TestingModule> => {
  const moduleRef = await Test.createTestingModule({ providers }).compile();
  return moduleRef;
};
