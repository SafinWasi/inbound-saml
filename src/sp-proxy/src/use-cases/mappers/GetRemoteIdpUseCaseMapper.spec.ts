import { RemoteIdpUseCaseParams } from '@sp-proxy/use-cases/io-models/RemoteIdpUseCaseParams'
import { makeRemoteIdpUseCaseStub } from '@sp-proxy/use-cases/mocks/remoteIdpUseCaseStub'
import { GetRemoteIdpUseCaseMapper } from '@sp-proxy/use-cases/mappers/GetRemoteIdpUseCaseMapper'

describe('GetRemoteIdpUseCaseMapper', () => {
  it('should map RemoteIdp entity to usecase props', () => {
    const fakeRemoteIdp = makeRemoteIdpUseCaseStub()
    const expectedResponseModel: RemoteIdpUseCaseParams = {
      id: fakeRemoteIdp.id,
      singleSignOnService: [
        {
          binding:
            fakeRemoteIdp.props.supportedSingleSignOnServices[0].props.binding,
          location:
            fakeRemoteIdp.props.supportedSingleSignOnServices[0].props.location
        }
      ],
      signingCertificates: fakeRemoteIdp.props.signingCertificates,
      name: fakeRemoteIdp.props.name
    }
    const sut = new GetRemoteIdpUseCaseMapper()
    expect(sut.map(fakeRemoteIdp)).toStrictEqual(expectedResponseModel)
  })
})