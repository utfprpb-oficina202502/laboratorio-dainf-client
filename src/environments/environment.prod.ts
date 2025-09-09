export const environment = {
  production: true,
  //api_url: 'http://localhost:8090/server/'
  api_url: 'https://dainf-labs-api.app.pb.utfpr.edu.br/',
  google_client_id: '726155933363-am0vqngulv5soqerhhprndt5kj4judtl.apps.googleusercontent.com',
  minio_url: 'https://minio.app.pb.utfpr.edu.br/dainf-labs/',
  charts: {
    colors: {
      primary: '#FCBC00',
      secondary: '#00468C',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#374151',
      gridLines: '#E5E7EB',
      tooltip: {
        background: '#1F2937',
        text: '#F9FAFB'
      },
      line: {
        stroke: '#00468C',
        fill: '#00468C'
      },
      bar: {
        palette: [
          '#B8860B', '#DAA520', '#FCBC00', '#FFD700', '#FFFF99',
          '#003366', '#004080', '#00468C', '#0066CC', '#99CCFF'
        ]
      },
      pie: {
        palette: [
          '#B8860B', '#DAA520', '#FCBC00', '#FFD700', '#FFFF99',
          '#003366', '#004080', '#00468C', '#0066CC', '#99CCFF'
        ]
      }
    }
  }
  //api_url: 'https://tcc-server-utfpr.herokuapp.com/server/'
  //"start": "node server.js",
};
