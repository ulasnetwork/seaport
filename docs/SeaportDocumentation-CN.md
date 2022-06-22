# Seaport 文档

围绕创建orders、fulfillment和与Seaport互动的文件。

## 名词解释

- offer:报价
- consideration：对价
- fulfill:全执行
- fill:执行
- conduit:通道

## Table of Contents

- [Order](#order)
- [Order Fulfillment](#order-fulfillment)
- [Sequence of Events](#sequence-of-events)
- [Known Limitations And Workarounds](#known-limitations-and-workarounds)



## Order

每个order包含11个关键组成部分:

- order的 `offerer` 提供所有offered items，并且必须亲自fulfill order（即`msg.sender == offerer`）或通过签名（标准的65字节EDCSA，64字节EIP-2098，或EIP-1271`isValidSignature`检查）或通过在链上列出orders（即调用`validate`）approve order。
- order的 `zone`是一个可选的二级账户，附加在order上，有两个额外的权限:
  - zone可以通过调用`cancel`来取消它被命名为zone的order。(注意，offerers也可以取消他们自己的order，可以单独取消，也可以通过调用`incrementCounter`一次取消所有与他们当前计数器签署的order).
  - `Restricted`(限制性)order（由order type指定）必须由zone或offerer执行，或者必须通过调用zone上的 "isValidOrder "或 "isValidOrderIncludingExtraData "视图函数来approve。
- `offer` 包含一个可从the offerer的账户中转移的item数组，其中每个item由以下部分组成:
  - `itemType` 指定item的类型，有效的类型是Ether（或其他给定链的本地代币）、ERC20、ERC721、ERC1155、带 "criteria"(标准)的ERC721（解释如下）和带标准的ERC1155.
  - `token`: 指定该item的代币合约账户（Ether或其他本地代币使用的是空地址）.
  - `identifierOrCriteria`: 代表ERC721或ERC1155代币标识符，如果是基于标准的item类型，则是由item的有效代币标识符集组成的merkle根。对于Ether和ERC20item类型，这个值将被忽略，对于基于标准的item类型，这个值可以选择为零，以允许任何标识符。
  - `startAmount`: 代表在order生效时，如果order得到满足，所需的有关商品的金额。
  - `endAmount`: 代表有关item的金额，如果order在到期时被fulfill，将需要该金额。如果这个值与item的 `startAmount`不同，实现的金额将根据order生效后的时间线性计算。
- `consideration`: 包含一个为了fulfill order而必须接收的item数组。它包含所有与提供的商品相同的组件，另外还包括一个将收到每件商品的 "recipient"。这个数组可以由fulfiller在order fulfill时扩展，以支持 `tipping`（小费）（例如，relayer 或者 referral payments）。
- `orderType`: 根据两种不同的偏好，为order指定了四种类型中的一种:
  - `FULL`: 表示order不支持`partial fills`(部分fill)，而 `PARTIAL`可以fillorder中的部分内容，但需要注意的是，每项内容必须能被所提供的份量整除（即除数后没有剩余）。
  - `OPEN`: 表示执行order的调用可以由任何账户提交，而`RESTRICTED`要求order要么由offerer或order的zone执行，要么在调用zone的`isValidOrder`或`isValidOrderIncludingExtraData`视图函数时返回一个表示order被approve的 value。
- `startTime`: 表示order变得活跃的区块时间戳
- `endTime`: 表示order到期的区块时间戳。这个值和 `startTime`与每个item的 `startAmount`和 `endAmount`一起使用，以得出它们的当前金额。
- `zoneHash`: 代表一个任意的32字节的值，在fulfill restricted order时将提供给zone，zone在决定是否授权该order时可以利用该值。
- `salt`: 代表order的一个任意的熵源。
- `conduitKey`: 是一个 `bytes32`的值，表示在进行transfe时，应该利用哪个conduit作为代币approve的来源。默认情况下（即当`conduitKey`被设置为零哈希值时），offerer将直接向Seaport授予ERC20、ERC721和ERC1155令牌approve，以便它在执行过程中可以执行order指定的任何transfe。相反，选择利用conduit的offerer将向与所提供的conduit密钥相对应的conduit合约授予代币approve，然后Seaport将指示该conduit transfer各自的代币。
- `counter`: 表示一个必须与给定offerer的当前计数器相匹配的值。

## Order Fulfillment

order通过以下四种方法之一fulfill:

- 调用两个 "standard "函数之一，`fulfillOrder`和`fulfillAdvancedOrder`，其中第二个隐含order将被构建，调用者为offerer，fulfilled order的consideration为offer，fulfilled order的offer为consideration（"advanced"order包含应被fulfill的份量，同时还有一组 "criteria resolvers（标准解析器）"，为fulfilled order上每个基于标准的item指定一个标识符和一个相应的包含证明）(an identifier and a corresponding)。所有offer item将从order的offerer转移到fulfiller,，然后所有consideration items（对价item）将从fulfiller,转移到指定的recipient。
- 调用 "basic "函数`fulfillBasicOrder`，并提供六种基本路径类型之一（`ETH_TO_ERC721`，`ETH_TO_ERC1155`，`ERC20_TO_ERC721`，`ERC20_TO_ERC1155`，`ERC721_TO_ERC20`和`ERC1155_TO_ERC20`）将从一个组件的子集得出要fulfill的order，假设有关order遵守以下规定:
  - 该order只包含一个offer item，并且至少包含一个对价item。
  - order中正好包含一个ERC721或ERC1155item，且该item不是基于标准。
  - order的提供方(offerer)是第一个考虑item的接收方(recipient)。
  - 所有其他商品具有相同的Ether（或其他本地代币）或ERC20商品类型和代币。
  - 该order不提供Ether（或其他本地代币）为item类型的item。
  - 每个item的 `startAmount`必须与该item的 `endAmount`相匹配（即item不能有升/降的金额）。
  - 所有 `ignored`(被忽略)的item字段（即本地item的`token`和`identifierOrCriteria`以及ERC20item的`identifierOrCriteria`）被设置为空地址或零。
  - 如果order有一个ERC721item，该item有一个`1'的金额
  - 如果order有多个对价item，并且除第一个对价item外的所有对价item与被提供的item类型相同，则被提供的item金额不低于除第一个对价item金额外的所有对价item金额之和。
- 调用两个 "fulfill可用(fulfill available)"函数之一，`fulfillAvailableOrders`和`fulfillAvailableAdvancedOrders`，其中一组order与一组fulfill一起提供，指定哪些offer item可以汇总到不同的转移，哪些consideration item可以相应汇总，任何已经被取消的order，有一个无效的时间，或已经被完全fill的order将被跳过，而不会导致其余可用order的恢复。此外，一旦找到 `maximumFulfilled`(最大fulfill量)的可用order，任何剩余的order将被跳过。与标准的fulfill方法类似，所有的offer item将从各自的offerer 转移到fulfiller，然后所有的对价item将从fulfiller转移到指定的recipient。
- 调用两个 "匹配(match) "函数之一，`matchOrders`和 `matchAdvancedOrders`，其中一组明确的order与一组fulfill的order一起提供，指定哪些offer item适用于哪些consideratio item "advanced"（高级）案例的操作方式与标准方法类似。但通过提供的 `numerator`和 `denominator`小数值以及一个可选的 `extraData`参数支持部分fill，该参数将在执行受限order类型时作为对区域的 `isValidOrderIncludingExtraData`视图函数的调用的一部分提供）。请注意，以这种方式完成的order没有一个明确的fulfiller；相反，Seaport将简单地确保每个order的需求一致。

虽然标准方法在技术上可用于fulfill任何order，但在某些情况下，它受到关键的效率限制:

- 与简单 "热路径(hot paths)"的基本方法相比，它需要额外的calldata。
- 它要求fulfiller approve每个consideration item，即使consideration item可以使用offer item来fulfill（当fulfill一个为ERC721或ERC1155 item提供ERC20 item的order，并且还包括具有相同ERC20item类型的consideration item以支付费用时，通常就是这种情况）。
- 这可能会导致不必要的转移，而在 "匹配(match)"的情况下，这些转移可以减少到一个更小的集合。

### Balance and Approval Requirements

当创建一个offer 时，应检查以下要求，以确保该order可以实现:

- offerer 应该有足够的所有offer item的balance 。
- 如果order没有指明使用conduit，offerer 应该为所有提供的ERC20、ERC721和ERC1155 item的seaport合约设置足够的批准。
- 如果order表明要使用conduit，offerer 应该为所有提供的ERC20、ERC721和ERC1155 item的相应conduit合约设置足够的批准。

当fulfill一个_base_order时，需要检查以下要求以确保该order可以fulfill:

- 需要进行上述检查，以确保offerer 仍有足够的balance 和批准。
- fulfiller应该拥有所有consideration item的足够balance _除了那些与order提供的item类型相匹配的item_--举例来说，如果fulfill的order提供了一个ERC20 item，并要求向offerer提供一个ERC721 item，向另一个receipt 提供相同的ERC20item，fulfiller需要拥有ERC72 1item，但不需要拥有ERC20 item，因为它将从offerer 那里采购。
- 如果fulfiller不选择使用conduit，他们需要为fulfilled order上的所有ERC20、ERC721和ERC1155 consideration item设置足够的approve，_但item类型与order提供的item类型相匹配的ERC20 item除外_。
- 如果fulfiller选择使用conduit，他们需要为fulfill order上的所有ERC20、ERC721和ERC1155 consideration item为各自的conduit设置足够的approve，但item类型与order提供的item类型相符的ERC20 item除外。
- 如果fulfill的order指定Ether（或其他本地代币）作为consideration item，fulfiller必须能够提供这些item的总和作为`msg.value`。

当fulfill一个_standerd_order时，需要检查以下要求以确保该order可以fulfill:

- 需要进行上述检查，以确保offerer 仍有足够的balance 和批准。
- 在收到所有offer item后，fulfiller应该有足够的所有consideration item的balance _--举例来说，如果fulfill的order提供了一个ERC20 item，并要求向offerer 提供一个ERC721 item，并向另一个recipient 提供相同的ERC20 item，其金额小于或等于提供的金额，fulfiller不需要拥有ERC20 item，因为它将首先从offerer那里收到。
- 如果fulfiller不选择使用conduit，他们需要为fulfill order上的所有ERC20、ERC721和ERC1155考虑item的Seaport合同设置足够的approve。
- 如果fulfiller选择使用conduit，他们需要为fulfill order上的所有ERC20、ERC721和ERC1155 consideration item的各自conduit设置足够的approve。
- 如果fulfill的order指定Ether（或其他本地代币）作为consideration item，fulfiller必须能够提供这些item的总和作为`msg.value`。

在执行一组_match_的order时，需要检查以下要求以确保order可以执行:

- 每个为执行的ERC20、ERC721或ERC1155item提供来源的账户，作为执行的一部分，在触发执行时，必须在Seaport或指定的conduit上有足够的balance和approve。请注意，之前的执行可以为后续的执行提供必要的balance 。
- 所有涉及Ether（或其他本地代币）的执行的总和必须作为`msg.value`提供。请注意，offerer和recipient为同一账户的执行将被过滤出最终执行集。

### Partial Fills(部分执行)

当构建一个order时，offerer可以通过设置适当的order类型来选择启用partial fills。然后，支持partial fills的order可以满足各自order的一些_部分，允许后续fill绕过签名验证。总结一下关于partial fills的几个关键点:

- 当创建支持partial fills的order或确定这些order的fills份量时，order上的所有item（包括offer 和consideration）必须能被提供的份量整除（即除数后没有剩余）。
- 如果所需fill的份量将导致超过全部order金额的fill，那么该份量将被减少到剩余的fill金额。这既适用于partial fills的尝试，也适用于fulfils的尝试。如果不希望有这种行为（即fill应该是 "全部或没有(all or none)"），fulfiller可以使用 "基本(basic) "order方法（如果有的话，它要求fill全部order金额），或者使用 "匹配(match) "order方法并明确提供一个要求收到全部所需金额的order。
  - 举例来说：如果一个fulfiller试图fill order的1/2，但另一个fulfiller首先fill了order的3/4，那么原来的fulfiller最终将fill order的1/4。
- 如果部分可成交order上的任何item指定了不同的 "startAmount "和 "endAmount"（例如，它们是递增金额或递减金额的item），在确定当前价格之前，份量将被应用于_这两个金额。这确保了在构建order时可以选择准确的可分割金额，而不依赖于order最终fulfill的时间。
- 部分fill可以与基于base的item相结合，以便构建提供或接收多个item的order，否则这些item将无法fills。然后，支持partial fill（例如ERC721item）。

  - 举例来说：一个offerer可以创建一个fills。然后，支持partial fill的order，为某一特定系列的最多10个ERC721item提供最多10个ETH；然后，任何fulfiller都可以fill该order的一部分，直到它被fulfill（或cancelled）。

## Sequence of Events(事件的顺序)

### Fulfill Order(fulfillorder)

当通过 "fulfillOrder "或 "fulfillAdvancedOrder "来fulfill一个order时:

1. Hash order(哈希顺序)
   - 为offer items和consideration items推导出哈希值
   - 检索offerer的当前counter
   - 衍生出order的哈希值
2. Perform initial validation(执行初始验证)
   - 确保当前时间是在order范围内
   - 确保order类型的有效调用者；如果order类型是restricted，并且调用者不是offerer或zone，则调用zone以确定order是否有效。
3. Retrieve and update order status(检索并更新order状态)
   - 确保order没有被cancelled
   - 确保order没有被fulfilled
     -如果order是_partially_ filled，必要时减少所提供的fill amount，以便order不会被overfilled
   - 如果尚未验证，则验证order签名
   - 根据偏好(preference)+可用金额(available amount)，确定要fill的部分
   - 更新order状态（已验证(validated)+fill部分(fill fraction)）
4. Determine amount for each item(确定每个item的金额)
   - 比较 start amount 和 end amount
     - 如果它们相等：对其中一个应用fill份量(fill fraction)，确保它分得很干净，并使用该金额
     - 如果不相等：对两者都应用fill份量(fill fraction)，确保它们都分得很干净，然后根据当前时间找到线性拟合。
5. Apply criteria resolvers(应用标准解析器)
   - 确保每个标准解析器(criteria resolver)都指向一个基于标准的order item(criteria-based order)
   - 如果item有一个非零的标准根(non-zero criteria root)，确保为每个item提供的标识符通过包含x性证明是有效的
   - 更新每个item的类型(type)和标识符(identifier)
   - 确保所有剩余的item都是非标准的(non-criteria-based)
6. Emit OrderFulfilled event(发出OrderFulfilled事件)
   - 包括更新的item（即在金额调整和标准解决后）
7. Transfer offer items from offerer to caller(将offer item从offerer转移到caller)
   - 根据order类型，直接使用conduit或Seaport来进行源头approve
8. Transfer consideration items from caller to respective recipients（将consideration item从caller转移到各自的recipient）
   - 根据fulfiller的声明偏好，使用conduit或Seaport直接对来源进行approve

> Note: `fulfillBasicOrder`的工作方式类似，但有一些例外：它从order元素的子集重建order，跳过线性拟合金额调整和标准解析，要求全部order金额可fill（the full order amount be fillable），并且当offer item 与其他consideration item共享相同的类型和标记时，默认执行一套更少的转移

### Match Orders

当通过 "matchOrders "或 "matchAdvancedOrders "匹配一组orders时，步骤1到6几乎是相同的，但对每个提供的order都要执行。从这里开始，实现就与标准的fulfillments不同了:

7. Apply fulfillments
   - 确保每个fulfillment都是指一个或多个offer items和一个或多个consideration items，都有相同的type和token，并且每个offer item有相同的approval来源，每个consideration item有相同的recipient
   - 将每个offer item和每个consideration item的金额减少到零，并跟踪每个item减少的总金额
   - 比较每个item的总金额，并将剩余的金额加到order相应一侧的第一个item上。
   - 为每项fulfillment返回一个单一的执行结果
8. Scan each consideration item and ensure that none still have a nonzero amount remaining（扫描每个consideration item，确保没有一个item的剩余金额为非零）
9. Perform transfers as part of each execution（作为每个执行的一部分进行转账）
   - 根据原始order类型，直接使用conduit或Seaport来获取approvals的来源
   - 忽略每个`to == from`或`amount == 0`的执行_（注意：目前的实现不执行这最后的优化）

## Known Limitations and Workarounds（已知的限制和解决方法）

- 由于所有的offer items和consideration items都是在内存中相互分配的，在某些情况下，实际收到的item金额会与order指定的金额不同--特别是，这包括具有转账费用机制的item。含有这种性质的item的order（或者，更广泛地说，有一些应该满足的执行后状态的item）应该利用 "受限（restricted） "的order类型，并通过一个在order执行完成后进行必要检查的zone contract来引导order的执行（fulfillment）。
- 由于所有offer items都是直接从offerer那里获取的，而所有consideration items都是直接给指定的recipient的，因此在有些情况下，这些账户会增加order fulfillment的gas成本，或者根据被转移的item，直接阻止order的fulfillment。如果有关item是Ether或类似的本地代币，recipient可以抛出可支付的回落，甚至花掉提交者（submitter）的多余gas。如果有问题的item是带有转移hook的代币（如ERC1155和ERC777）或非标准的代币实现，offerers和receives都可以利用类似的机制。这类问题的潜在补救措施包括将Ether包装成WETH，作为初始转移失败时的退路，并允许提交者(submitters)指定作为特定fulfillment.的一部分应分配的gas数量。支持明确fulfillment的order也可以选择留下有问题的或不需要的 offer items，只要所有的consideration items都全额收到。
- 由于fulfillments可以按照fulfiller指定的任何顺序执行，只要fulfiller都可以执行，由于限制性orders在执行前通过zones进行验证，并且由于order可以与其他order组合或提供额外的consideration items，任何具有可修改状态的item在执行期间都有可能被修改状态，如果应付以太recipient或onReceived 1155传输钩能够修改该状态。然后，即使offerer通过检查属性的限制性order强制要求ERC721具有该属性，恶意的fulfiller也可以拥有第二个order（甚至只是一个额外的consideration item），在将ERC721item转让给offerer之前，使用该itembeing sold to mint。 对这个问题的一类补救措施是使用不实现`isValidOrder`的限制性order，实际上要求order的fulfillment通过它们来进行，以便它们能够进行执行后验证。 这个问题的另一个有趣的解决方案是 "以毒攻毒(fight fire with fire)"，让提供方在需要额外保证的order上包含一个 "验证器(validator) "ERC1155考虑项。这将是一个包含ERC1155接口的合约，但实际上不是1155token，而是利用 `onReceived`钩子作为验证预期不变性的手段，如果检查失败，则恢复 "transfer"（所以在上面的例子中，这个钩子将确保offerer是有关ERC721item的owner，并且它还没有被用来铸造其他ERC721）。 这个机制的关键限制是可以通过这个途径在带内(in-band)提供的数据量；只有三个参数（"from"、"identifier "和 "amount"）可供利用。
- As all consideration items are supplied at the time of order creation, dynamic adjustment of recipients or amounts after creation (e.g. modifications to royalty payout info) is not supported. However, a zone can enforce that a given restricted order contains _new_ dynamically computed consideration items by deriving them and either supplying them manually or ensuring that they are present via `isValidZoneIncludingExtraData` since consideration items can be extended arbitrarily, with the important caveat that no more than the original offer item amounts can be spent.
- As all criteria-based items are tied to a particular token, there is no native way to construct orders where items specify cross-token criteria. Additionally, each potential identifier for a particular criteria-based item must have the same amount as any other identifier.
- As orders that contain items with ascending or descending amounts may not be filled as quickly as a fulfiller would like (e.g. transactions taking longer than expected to be included), there is a risk that fulfillment on those orders will supply a larger item amount, or receive back a smaller item amount, than they intended or expected. One way to prevent these outcomes is to utilize `matchOrders`, supplying a contrasting order for the fulfiller that explicitly specifies the maximum allowable offer items to be spent and consideration items to be received back. Special care should be taken when handling orders that contain both brief durations as well as items with ascending or descending amounts, as realized amounts may shift appreciably in a short window of time.
- As all items on orders supporting partial fills must be "cleanly divisible" when performing a partial fill, orders with multiple items should be constructed with care. A straightforward heuristic is to start with a "unit" bundle (e.g. 1 NFT item A, 3 NFT item B, and 5 NFT item C for 2 ETH) then applying a multiple to that unit bundle (e.g. 7 of those units results in a partial order for 7 NFT item A, 21 NFT item B, and 35 NFT item C for 14 ETH).
- As Ether cannot be "taken" from an account, any order that contains Ether or other native tokens as an offer item (including "implied" mirror orders) must be supplied by the caller executing the order(s) as msg.value. This also explains why there are no `ERC721_TO_ETH` and `ERC1155_TO_ETH` basic order route types, as Ether cannot be taken from the offerer in these cases. One important takeaway from this mechanic is that, technically, anyone can supply Ether on behalf of a given offerer (whereas the offerer themselves must supply all other items). It also means that all Ether must be supplied at the time the order or group of orders is originally called (and the amount available to spend by offer items cannot be increased by an external source during execution as is the case for token balances).
- As extensions to the consideration array on fulfillment (i.e. "tipping") can be arbitrarily set by the caller, fulfillments where all matched orders have already been signed for or validated can be frontrun on submission, with the frontrunner modifying any tips. Therefore, it is important that orders fulfilled in this manner either leverage "restricted" order types with a zone that enforces appropriate allocation of consideration extensions, or that each offer item is fully spent and each consideration item is appropriately declared on order creation.
- As orders that have been verified (via a call to `validate`) or partially filled will skip signature validation on subsequent fulfillments, orders that utilize EIP-1271 for verifying orders may end up in an inconsistent state where the original signature is no longer valid but the order is still fulfillable. In these cases, the offerer must explicitly cancel the previously verified order in question if they no longer wish for the order to be fulfillable.
- As orders filled by the "fulfill available" method will only be skipped if those orders have been cancelled, fully filled, or are inactive, fulfillments may still be attempted on unfulfillable orders (examples include revoked approvals or insufficient balances). This scenario (as well as issues with order formatting) will result in the full batch failing. One remediation to this failure condition is to perform additional checks from an executing zone or wrapper contract when constructing the call and filtering orders based on those checks.
- As order parameters must be supplied upon cancellation, orders that were meant to remain private (e.g. were not published publicly) will be made visible upon cancellation. While these orders would not be _fulfillable_ without a corresponding signature, cancellation of private orders without broadcasting intent currently requires the offerer (or the zone, if the order type is restricted and the zone supports it) to increment the counter.
- As order fulfillment attempts may become public before being included in a block, there is a risk of those orders being front-run. This risk is magnified in cases where offered items contain ascending amounts or consideration items contain descending amounts, as there is added incentive to leave the order unfulfilled until another interested fulfiller attempts to fulfill the order in question. Remediation efforts include utilization of a private mempool (e.g. flashbots) and/or restricted orders where the respective zone enforces a commit-reveal scheme.
