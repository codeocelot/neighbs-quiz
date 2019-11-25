import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';


configure({ adapter: new Adapter() });

Object.defineProperty(navigator, 'geolocation', { get: () => ({ getCurrentPosition: jest.fn(), watchPosition: jest.fn(), clearWatch: jest.fn() }) });

export default {};
