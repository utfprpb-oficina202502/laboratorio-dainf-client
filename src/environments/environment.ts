import {defaultChartColors} from '../app/framework/charts/chart-colors.config';

export const environment = {
  production: false,
  //api_url: 'https://test-labs-api.app.pb.utfpr.edu.br/',
  api_url: 'https://dainf-server-dev-e1c111fedbcc.herokuapp.com/',
  //api_url: 'http://localhost:8099/',
  google_client_id: '726155933363-am0vqngulv5soqerhhprndt5kj4judtl.apps.googleusercontent.com',
  minio_url: 'https://kirinus.tec.br:9000/utfpr-bucket/',
  charts: {
    colors: defaultChartColors
  }
};

