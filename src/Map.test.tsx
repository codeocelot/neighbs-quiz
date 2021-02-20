import React from 'react';
import ReactDOM from 'react-dom';
import { mount } from 'enzyme';
import { html } from 'js-beautify';
import { StaticRouter } from 'react-router'
import Map from './Map';
import * as shuffleModule from './shuffle';

beforeEach(() => {
  const shuffleSpy = jest.spyOn(shuffleModule, 'default');
  shuffleSpy.mockImplementation((arr) => arr);
})

it('renders without crashing', () => {
  
  const div = document.createElement('div');
  ReactDOM.render(<StaticRouter><Map /></StaticRouter>, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('works', () => {
  const tree = mount(<StaticRouter><Map /></StaticRouter>);
  tree.find('button#start-game-btn').simulate('click');
  
  expect(html(tree.html(), { indent_size: 2})).toMatchSnapshot();
})
