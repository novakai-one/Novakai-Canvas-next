# Unit 2 — verified finding resolution

One fix round. U2-01 verified against WorkspaceSidePanel: the action label always said Hide even while hidden=true. The action now says Show for hidden sections and Hide for visible sections. Toggle behavior is unchanged.

Independent coverage remains partial: resizing, full modal behavior and dirty-input focus during section movement were not verified by this audit. No second audit has been performed.
