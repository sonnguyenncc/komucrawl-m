import { Injectable } from '@nestjs/common';
import { IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../models/user.entity';
import { ChannelMessage, MezonClient } from 'mezon-sdk';
import { EUserType } from '../constants/configs';
import { MezonClientService } from 'src/mezon/services/client.service';
import { ChannelDMMezon } from '../models/channelDmMezon.entity';
import { ChannelMezon } from '../models';

@Injectable()
export class ExtendersService {
  private client: MezonClient;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private clientService: MezonClientService,
    @InjectRepository(ChannelDMMezon)
    private channelDmMezonRepository: Repository<ChannelDMMezon>,
    @InjectRepository(ChannelMezon)
    private mezonChannelRepository: Repository<ChannelMezon>,
  ) {
    this.client = this.clientService.getClient();
    this.initializeChannelDm();
  }

  async initializeChannelDm() {
    try {
      const channels = await this.channelDmMezonRepository.find();
      // const privateChannels = await this.mezonChannelRepository.find({
      //   where: {
      //     clan_id: '1837043892743049216',
      //     channel_type: 1,
      //     channel_private: 1,
      //   },
      // });

      const privateChannelArrayTemp = [
        '1840946886257676288',
        '1844316645296705536',
        '1840651595688185856',
        '1840946991538900992',
        '1838398589819162624',
        '1833699295371464704',
        '1833331306226782208',
        '1831558370155302912',
        '1833338089020329984',
        '1841312647044141056',
        '1833321033659060224',
        '1833342907759726592',
        '1840653052005060608',
        '1831884482005700608',
        '1833338540683956224',
        '1833342664125190144',
        '1833159973408870400',
        '1840652084345573376',
        '1838844110698450944',
        '1831899708327464960',
        '1833342808421830656',
        '1833100314920620032',
        '1833332141736333312',
        '1843213379179646976',
        '1833328020287393792',
        '1833308983264284672',
        '1780067671375613952',
        '1833324639007281152',
        '1840652480770215936',
        '1838440938507079680',
        '1840677578034122752',
        '1832748628813287424',
        '1838878360814489600',
        '1838826073710661632',
        '1843201891673051136',
        '1800871793087483904',
        '1839138905396350976',
        '1838421105535094784',
        '1833308925500329984',
        '1843173741245239296',
        '1841661831786008576',
        '1834120373080166400',
        '1839143134173335552',
        '1833330378203467776',
        '1841306037383073792',
        '1829084524978376704',
        '1833311732227903488',
        '1833311864398811136',
        '1833311897726750720',
        '1833318588497268736',
        '1833318996372361216',
        '1833330053371400192',
        '1833330200415309824',
        '1833704189419589632',
        '1833750922522529792',
        '1835978738924261376',
        '1838423296991825920',
        '1838431888415395840',
        '1840651662050463744',
        '1841303975853297664',
        '1841338171099451392',
        '1841403808698077184',
        '1841685110227734528',
        '1841697846978416640',
        '1842019704688873472',
        '1842050186981937152',
        '1842052559137673216',
        '1842452639795646464',
        '1842453021854797824',
        '1842550226338975744',
        '1843106007392194560',
        '1843174037711228928',
        '1843242031623704576',
        '1843102712611213312',
        '1843103332256714752',
        '1840962859593371648',
        '1843144243757977600',
        '1843109780491603968',
        '1843145379986542592',
        '1840932225344868352',
        '1841411401357201408',
        '1836342817182453760',
        '1843128117284048896',
        '1834168462289670144',
        '1834114452618743808',
        '1834088982103724032',
        '1838833473847037952',
        '1831556096850923520',
        '1831556022339112960',
        '1833318388114395136',
        '1841290471456903168',
        '1843111117623136256',
        '1840651799476834304',
        '1831885087998742528',
        '1833361163941842944',
        '1829084343625060352',
        '1833343019890249728',
        '1833330197638680576',
        '1829084224045453312',
        '1835536744175374336',
        '1840600916990889984',
        '1833363160145334272',
        '1838831037543616512',
        '1833325547728408576',
        '1833100786360389632',
        '1833102953188167680',
        '1833425235701927936',
        '1831532638167371776',
        '1839139212134191104',
        '1842039836899282944',
        '1833315823393968128',
        '1841671940910092288',
        '1833316598400684032',
        '1842059807247306752',
        '1833099538211016704',
        '1831899009736773632',
        '1842025373781463040',
        '1833310762479652864',
        '1840652591365623808',
        '1842037230084820992',
        '1841680712533544960',
        '1833331853608620032',
        '1833428686825590784',
        '1843230090658320384',
        '1838858806549811200',
        '1833341515963830272',
        '1833429489367912448',
        '1833324963088568320',
        '1841678004955123712',
        '1840678703248445440',
        '1840679274319712256',
        '1833336305015066624',
        '1838040972399742976',
        '1833099049633320960',
        '1834123033497833472',
        '1829449968461549568',
        '1843193662175973376',
        '1831531260632109056',
        '1831543728112668672',
        '1840934248442236928',
        '1831558245743857664',
        '1833315024966258688',
        '1843230418829053952',
        '1840651864534683648',
        '1840651718912643072',
        '1840651718249943040',
        '1831893186792919040',
        '1840651775607050240',
        '1832749034909995008',
        '1832955343634698240',
        '1839618910500950016',
        '1840599015910019072',
        '1842053801192722432',
        '1833343554391379968',
        '1813437215095656448',
        '1834121611033186304',
        '1840652498256269312',
        '1840652498486956032',
        '1840652499451645952',
        '1840652499028021248',
        '1840652498579230720',
        '1840652499296456704',
        '1840652499543920640',
        '1840652499246125056',
        '1842106625289097216',
        '1840652513624199168',
        '1840652498101080064',
        '1840652498847666176',
        '1840652498050748416',
        '1840652499107713024',
        '1840652499187404800',
        '1840652499485200384',
        '1840652499409702912',
        '1840652498168188928',
        '1833343402138144768',
        '1833360847376748544',
        '1843112952719216640',
        '1833330451213717504',
        '1835567080192086016',
        '1832954996241469440',
        '1833362227189518336',
        '1843121928680771584',
        '1833331797883097088',
        '1833340344624746496',
        '1833324342818115584',
        '1840599734620786688',
        '1833344796064747520',
        '1832748782505168896',
        '1833340770640203776',
        '1833337962096496640',
        '1833338776202514432',
        '1833337693761703936',
        '1840662264764436480',
        '1840652722190159872',
        '1826910613125730304',
        '1779843289046847488',
        '1831537368687972352',
        '1834132067722465280',
        '1833309036221566976',
        '1841657692960067584',
        '1833317001175502848',
        '1842061492661260288',
        '1833420626379935744',
        '1833316737794183168',
        '1842058622050242560',
        '1832954868969508864',
        '1840999273278214144',
        '1833103153193553920',
        '1831588176129429504',
        '1831588147679465472',
        '1832955524342091776',
        '1833338333539864576',
        '1833338516587679744',
        '1833100677824385024',
        '1779484504386179073',
        '1842029619067228160',
        '1833099391120969728',
        '1843210028476010496',
        '1843121422503776256',
        '1843871243988635648',
        '1780052870956060672',
        '1832954141131935744',
        '1843490307392409600',
        '1843176854228307968',
        '1840651401735180288',
        '1844266704255848448',
        '1833316823710306304',
        '1833323666704699392',
        '1843093411612069888',
        '1841388719882375168',
        '1838857853750743040',
        '1835856346465964032',
        '1844270697686241280',
        '1832747892989759488',
        '1833305297951657984',
        '1842064862901964800',
        '1839137228501028864',
        '1839136813051023360',
        '1833340449859833856',
        '1836653238837841920',
        '1842871936414126080',
        '1842398215412912128',
        '1840591113946140672',
        '1841010937662803968',
        '1800358427633913856',
        '1832749347960262656',
        '1829444265030193152',
        '1832748405412073472',
        '1841658128538537984',
        '1842060726307393536',
        '1843895702598455296',
        '1843858002474438656',
        '1843864243615567872',
        '1843465530690768896',
        '1841750654079471616',
        '1839488444485603328',
        '1831509210274205696',
        '1834617557747765248',
        '1831891989407207424',
        '1843542766164905984',
        '1840652034705985536',
        '1832962693636558848',
        '1843929873203073024',
        '1840652026468372480',
        '1832749137683025920',
        '1833310260517933056',
        '1838397960824557568',
        '1838393078046527488',
        '1842109902021988352',
        '1840653074104848384',
        '1841375260058849280',
        '1840653128685326336',
        '1840652173306761216',
        '1843924739207204864',
        '1833315146458468352',
        '1840605340622655488',
        '1840651938085998592',
        '1840940374529413120',
        '1832955208016072704',
        '1840652495714521088',
        '1840652494187794432',
        '1840652497589374976',
        '1840652496263974912',
        '1840652495114735616',
        '1842106431499669504',
        '1843462559940743168',
        '1832747623589613568',
        '1843241640374833152',
        '1833315346036035584',
        '1840651876211625984',
        '1829084663411380224',
        '1833320900129198080',
        '1833332339644567552',
        '1843549893277257728',
        '1832748899169734656',
        '1836681456311603200',
        '1843479246966624256',
        '1843479583949590528',
        '1833318670386860032',
        '1843144173490802688',
        '1832953896457211904',
        '1833339331280900096',
        '1780077694151561216',
        '1842038372726476800',
        '1832954709099417600',
        '1829084012019191808',
        '1833099868827029504',
        '1843473018492293120',
        '1832749550566117376',
        '1833316695846948864',
        '1842062137011212288',
        '1833328187623346176',
        '1831525207425159168',
        '1840962648078815232',
        '1840961198477021184',
        '1833320827722928128',
        '1838399152342437888',
        '1833152700116635648',
        '1834122395858767872',
        '1843847957539983360',
        '1832749414897160192',
        '1833335980317216768',
        '1843460504383655936',
        '1842035769946935296',
        '1843143822024904704',
        '1834089970151723008',
        '1840652817019179008',
        '1834122221023399936',
        '1833326717205221376',
        '1833334677646086144',
        '1840958620754251776',
        '1831881903511179264',
        '1841732288258248704',
        '1838045124026699776',
        '1833340253138587648',
        '1833312985053925376',
        '1833315229837037568',
        '1839134809536860160',
        '1839134269025292288',
      ];

      channels.map(async (channel) => {
        try {
          await this.client.joinChat('0', channel.channel_id, 3, false);
        } catch (error) {
          console.log('error channels', error);
        }
      });
      privateChannelArrayTemp.map(async (channelId) => {
        try {
          await this.client.joinChat(
            process.env.KOMUBOTREST_CLAN_NCC_ID,
            channelId,
            1,
            false,
          );
        } catch (error) {
          console.log('error privateChannels', error);
        }
      });
    } catch (error) {
      console.log('initializeChannelDm error', error);
    }
  }

  async addDBUser(message: ChannelMessage) {
    if (message.sender_id === '1767478432163172999') return; // ignored anonymous user
    const findUser = await this.userRepository.findOne({
      where: { userId: message.sender_id },
    });

    if (findUser) {
      findUser.userId = message.sender_id;
      findUser.username = message.username;
      findUser.discriminator = '0';
      findUser.avatar = message.avatar;
      findUser.bot = false;
      findUser.system = false;
      findUser.email = message.username;
      findUser.display_name = message.display_name ?? '';
      findUser.clan_nick = message.clan_nick ?? '';
      findUser.user_type = EUserType.MEZON;
      findUser.flags = 0;
      findUser.last_message_id = message.message_id;
      findUser.last_message_time = Date.now();
      findUser.deactive = false;
      findUser.botPing = findUser.botPing;
      findUser.scores_workout = 0;
      findUser.not_workout = 0;
      await this.userRepository.save(findUser);
      return;
    }

    const komuUser = {
      userId: message.sender_id,
      username: message.username,
      discriminator: '0',
      avatar: message.avatar,
      bot: false,
      system: false,
      email: message.username,
      display_name: message.display_name ?? '',
      clan_nick: message.clan_nick ?? '',
      flags: 0,
      last_message_id: message.message_id,
      last_message_time: Date.now(),
      scores_quiz: 0,
      deactive: false,
      botPing: false,
      scores_workout: 0,
      not_workout: 0,
      user_type: EUserType.MEZON,
      createdAt: Date.now(),
    };

    await this.userRepository.insert(komuUser);
  }
}
