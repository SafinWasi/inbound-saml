// receive host from interactor
// calls mongo findOne
// map mongo document to entity
// return entity
import * as mongodb from 'mongodb'
import { TrustRelation } from '@sp-proxy/entities/TrustRelation'
import { MongoGetTrByHost } from '@sp-proxy/interface-adapters/data/MongoGetTrByHost'
import { IDataMapper } from '@sp-proxy/interface-adapters/protocols/IDataMapper'
import { ITrustRelationProps } from '@sp-proxy/entities/protocols/ITrustRelationProps'
import { makeRemoteIdpDataStub } from '@sp-proxy/interface-adapters/data/mocks/remoteIdpDataStub'
import { makeSingleSignOnService } from '@sp-proxy/entities/factories/makeSingleSignOnService'
import { PersistenceError } from '@sp-proxy/interface-adapters/data/errors/PersistenceError'

interface SutTypes {
  sut: MongoGetTrByHost
  collectionStub: mongodb.Collection
  dataMapperStub: IDataMapper<mongodb.Document, TrustRelation>
}

const client = new mongodb.MongoClient('mongodb://anyurl')

const makeTrustRelationDataStub = (): TrustRelation => {
  const props: ITrustRelationProps = {
    remoteIdp: makeRemoteIdpDataStub(),
    singleSignOnService: makeSingleSignOnService({
      binding: 'stubbed binding',
      location: 'stubbed location'
    })
  }
  return new TrustRelation(props)
}

const makeDataMapper = (): IDataMapper<mongodb.Document, TrustRelation> => {
  class DataMapperStub implements IDataMapper<mongodb.Document, TrustRelation> {
    async map(dbData: mongodb.Document): Promise<TrustRelation> {
      return makeTrustRelationDataStub()
    }
  }
  return new DataMapperStub()
}

const makeSut = (): SutTypes => {
  const collectionStub = client.db().collection('any-valid-collection')
  const dataMapperStub = makeDataMapper()
  const sut = new MongoGetTrByHost(collectionStub, dataMapperStub)
  return {
    sut,
    collectionStub,
    dataMapperStub
  }
}

describe('MongoGetTrByHost', () => {
  it('should call mongo findOne with host', async () => {
    const { sut, collectionStub } = makeSut()
    const findOneSpy = jest
      .spyOn(collectionStub as any, 'findOne')
      .mockResolvedValueOnce('')
    await sut.findByHost('valid host')
    expect(findOneSpy).toHaveBeenCalledTimes(1)
    expect(findOneSpy).toHaveBeenCalledWith({
      'trustRelation.props.singleSignOnService.props.location': /valid host/
    })
  })
  it('should throw PersistenceError if findOne throws', async () => {
    const { sut, collectionStub } = makeSut()
    jest.spyOn(collectionStub, 'findOne').mockImplementationOnce(() => {
      throw new Error()
    })
    await expect(sut.findByHost('valid host')).rejects.toThrow(PersistenceError)
  })
  it('should call mapper with mongo document', async () => {
    const { sut, collectionStub, dataMapperStub } = makeSut()
    jest
      .spyOn(collectionStub as any, 'findOne')
      .mockResolvedValueOnce('valid document returned from findOne')
    const mapSpy = jest.spyOn(dataMapperStub, 'map')
    await sut.findByHost('valid host')
    expect(mapSpy).toHaveBeenCalledTimes(1)
    expect(mapSpy).toHaveBeenCalledWith('valid document returned from findOne')
  })
  it('should throw PersistenceError if TR not found', async () => {
    const { sut, collectionStub } = makeSut()
    jest
      .spyOn(collectionStub as any, 'findOne')
      .mockResolvedValueOnce(undefined)
    await expect(sut.findByHost('valid host')).rejects.toThrow(PersistenceError)
  })
  it('should return mapped entity', async () => {
    const { sut, dataMapperStub, collectionStub } = makeSut()
    jest.spyOn(collectionStub as any, 'findOne').mockResolvedValueOnce('')
    jest
      .spyOn(dataMapperStub, 'map')
      .mockResolvedValueOnce('mapped entity' as any)
    expect(await sut.findByHost('valid host')).toBe('mapped entity')
  })
})