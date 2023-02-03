import React from 'react'

export default function ListItem(props: any) {
  const { label } = props;
  return (
      <li>{label}</li>
  )
}