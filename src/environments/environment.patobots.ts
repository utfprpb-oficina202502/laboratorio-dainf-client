export const environment = {
  production: true,
  api_url: 'https://patobots-labs-api.app.pb.utfpr.edu.br/',
  google_client_id: '726155933363-am0vqngulv5soqerhhprndt5kj4judtl.apps.googleusercontent.com',
  minio_url: 'https://minio.app.pb.utfpr.edu.br/patobots-labs/',
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
};
