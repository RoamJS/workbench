import { Button } from "@blueprintjs/core";
import React from "react";

type WeeklyNoteNavProps = {
  nextTitle: string;
  onNavigate: (pageName: string) => void;
  prevTitle: string;
};

const WeeklyNoteNav = ({
  nextTitle,
  onNavigate,
  prevTitle,
}: WeeklyNoteNavProps) => (
  <div className="flex justify-between mb-8">
    <Button
      icon="arrow-left"
      minimal
      onClick={() => onNavigate(prevTitle)}
      outlined
      text="Last Week"
    />
    <Button
      minimal
      onClick={() => onNavigate(nextTitle)}
      outlined
      rightIcon="arrow-right"
      text="Next Week"
    />
  </div>
);

export default WeeklyNoteNav;
