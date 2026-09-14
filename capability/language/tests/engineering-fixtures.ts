export const erSource = `canvas 1 collection @commerce "Commerce" {
 node @customer entity "Customer" {
  field @tenant "tenant" type="TenantId"
  field @id "id" type="CustomerId"
  field @email "email" type="Email" key=unique
  keygroup @pk kind=primary fields=[@tenant,@id]
 }
 node @order entity "Order" {
  field @id "id" type="OrderId" key=primary
  field @tenant "tenant" type="TenantId"
  field @customer "customerId" type="CustomerId"
  field @mail "email" type="Email" key=foreign references=@customer.@email
  keygroup @fk kind=foreign fields=[@tenant,@customer] references=[@customer.@tenant,@customer.@id]
 }
 wire @places @customer.@id -> @order.@customer "places" kind=association from=1 to=0..many
 section @data "Customer and orders" mode=er { show @customer @order connect @places }
}`;
export const modulesSource = `canvas 1 collection @modules "Contracts" {
 source @spec "https://example.com/spec" revision="1" location="Authoring" description="Contract evidence"
 node @spec module "Authoring" sources=[@spec] {
  port @plans out "planner" type="TransitionPlanner"
  port @apply in "apply" type="ChangeRequest → Result"
 }
 node @planner interface "TransitionPlanner" {
  member @plan "plan" type="(Snapshot, Intent) → Result" visibility=public
 }
 node @validate function "validateTransition" {
  signature @call "validateTransition" parameters=["snapshot: Snapshot", "intent: Intent"] returns="Result"
 }
 wire @uses @spec.@plans -> @planner "imports type contract" kind=imports sources=[@spec]
 wire @implements @validate -> @planner.@plan "implements plan" kind=implements
 section @contracts "Module contracts" mode=modules { show @spec @planner @validate connect @uses @implements }
}`;
export const sequenceSource = `canvas 1 collection @sequence "Conversation" {
 node @human participant "Human" {} node @agent participant "Agent" {}
 section @conversation "Exchange" mode=sequence {
  show @human @agent
  event @request @human -> @agent "Request" kind=call activate=true
  fragment @alternatives alt "Outcome" {
   branch @success "Success" { fragment @repeat loop "Retry" { event @reply @agent -> @human "Response" kind=return activate=false } }
   branch "Failure" { fragment @optional opt "Explain" { event @failure @agent -> @human "Failure" kind=return activate=false } }
  }
 }
}`;
export const stateSource = `canvas 1 collection @states "Lifecycle" {
 node @start start "Begin" {} node @working state "Working" {} node @done end "Done" {}
 wire @begin @start -> @working "Begin" kind=transition guard="ready" effect="start work"
 wire @finish @working -> @done "Complete" kind=transition guard="passed" effect="record receipt"
 section @states "State machine" mode=state { show @start @working @done connect @begin @finish }
 section @story "Explanation" mode=story order=2 { show @working @start @done }
 section @grid "Overview" mode=grid order=3 { show @working }
}`;
